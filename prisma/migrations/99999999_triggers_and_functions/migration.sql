-- ================================
-- ZABLINK - TOKEN SYSTEM
-- TRIGGERS & FUNCTIONS
-- ================================

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ================================
-- FUNCTION 1: Auto-expire tokens
-- ================================

CREATE OR REPLACE FUNCTION expire_tokens()
RETURNS void AS $$
BEGIN
  -- Mark expired batches
  UPDATE token_batches
  SET is_expired = true
  WHERE expires_at < NOW()
    AND is_expired = false;
    
  -- Create expiry transactions
  INSERT INTO token_transactions (
    id, balance_id, type, amount, balance, 
    description, created_at
  )
  SELECT 
    gen_random_uuid()::text,
    tb.balance_id,
    'expire',
    -tb.remaining_amount,
    (SELECT available_tokens FROM token_balances WHERE id = tb.balance_id),
    'Token หมดอายุ ' || tb.remaining_amount || ' tokens',
    NOW()
  FROM token_batches tb
  WHERE tb.expires_at < NOW()
    AND tb.is_expired = false
    AND tb.remaining_amount > 0;
    
  -- Update balances
  UPDATE token_balances tb
  SET 
    available_tokens = available_tokens - (
      SELECT COALESCE(SUM(remaining_amount), 0)
      FROM token_batches
      WHERE balance_id = tb.id
        AND expires_at < NOW()
        AND is_expired = false
    ),
    updated_at = NOW()
  WHERE EXISTS (
    SELECT 1 FROM token_batches
    WHERE balance_id = tb.id
      AND expires_at < NOW()
      AND is_expired = false
      AND remaining_amount > 0
  );
    
  -- Zero out expired batches
  UPDATE token_batches
  SET remaining_amount = 0
  WHERE expires_at < NOW()
    AND is_expired = false;
END;
$$ LANGUAGE plpgsql;

-- Note: To schedule this function to run daily, use pg_cron extension:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expire-tokens-daily', '0 0 * * *', 'SELECT expire_tokens()');

-- ================================
-- FUNCTION 2: Spend tokens (FIFO)
-- ================================

CREATE OR REPLACE FUNCTION spend_tokens(
  p_balance_id TEXT,
  p_amount INT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INT;
  v_remaining INT;
  v_batch RECORD;
  v_to_deduct INT;
  v_new_balance INT;
BEGIN
  -- Check available balance
  SELECT available_tokens INTO v_available
  FROM token_balances
  WHERE id = p_balance_id;
  
  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Balance not found: %', p_balance_id;
  END IF;
  
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens. Available: %, Required: %', v_available, p_amount;
  END IF;
  
  v_remaining := p_amount;
  
  -- Deduct from batches (FIFO - oldest first)
  FOR v_batch IN 
    SELECT * FROM token_batches
    WHERE balance_id = p_balance_id
      AND remaining_amount > 0
      AND is_expired = false
    ORDER BY received_at ASC
  LOOP
    IF v_remaining <= 0 THEN
      EXIT;
    END IF;
    
    v_to_deduct := LEAST(v_batch.remaining_amount, v_remaining);
    
    UPDATE token_batches
    SET remaining_amount = remaining_amount - v_to_deduct
    WHERE id = v_batch.id;
    
    v_remaining := v_remaining - v_to_deduct;
  END LOOP;
  
  -- Update balance
  UPDATE token_balances
  SET 
    used_tokens = used_tokens + p_amount,
    available_tokens = available_tokens - p_amount,
    updated_at = NOW()
  WHERE id = p_balance_id
  RETURNING available_tokens INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO token_transactions (
    id, balance_id, type, amount, balance,
    reference_type, reference_id, description, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_balance_id,
    'spend',
    -p_amount,
    v_new_balance,
    p_reference_type,
    p_reference_id,
    p_description,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION 3: Add tokens
-- ================================

CREATE OR REPLACE FUNCTION add_tokens(
  p_balance_id TEXT,
  p_amount INT,
  p_source TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_order_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_batch_id TEXT;
  v_expires_at TIMESTAMP;
  v_new_balance INT;
BEGIN
  -- Calculate expiry (3 months from now)
  v_expires_at := NOW() + INTERVAL '3 months';
  
  -- Generate batch ID
  v_batch_id := gen_random_uuid()::text;
  
  -- Create batch
  INSERT INTO token_batches (
    id, balance_id, amount, remaining_amount,
    source, received_at, expires_at,
    subscription_id, order_id, is_expired, created_at
  )
  VALUES (
    v_batch_id,
    p_balance_id,
    p_amount,
    p_amount,
    p_source,
    NOW(),
    v_expires_at,
    p_subscription_id,
    p_order_id,
    false,
    NOW()
  );
  
  -- Update balance
  UPDATE token_balances
  SET 
    total_tokens = total_tokens + p_amount,
    available_tokens = available_tokens + p_amount,
    updated_at = NOW()
  WHERE id = p_balance_id
  RETURNING available_tokens INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO token_transactions (
    id, balance_id, type, amount, balance,
    description, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_balance_id,
    'earn',
    p_amount,
    v_new_balance,
    'ได้รับ ' || p_amount || ' tokens จาก ' || p_source,
    NOW()
  );
  
  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION 4: Refund tokens
-- ================================

CREATE OR REPLACE FUNCTION refund_tokens(
  p_balance_id TEXT,
  p_amount INT,
  p_reference_type TEXT,
  p_reference_id TEXT,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance INT;
  v_expires_at TIMESTAMP;
BEGIN
  -- Calculate expiry (3 months from now for refunded tokens)
  v_expires_at := NOW() + INTERVAL '3 months';
  
  -- Create a new batch for refunded tokens
  INSERT INTO token_batches (
    id, balance_id, amount, remaining_amount,
    source, received_at, expires_at,
    is_expired, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_balance_id,
    p_amount,
    p_amount,
    'refund',
    NOW(),
    v_expires_at,
    false,
    NOW()
  );
  
  -- Update balance
  UPDATE token_balances
  SET 
    total_tokens = total_tokens + p_amount,
    available_tokens = available_tokens + p_amount,
    used_tokens = used_tokens - p_amount,
    updated_at = NOW()
  WHERE id = p_balance_id
  RETURNING available_tokens INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO token_transactions (
    id, balance_id, type, amount, balance,
    reference_type, reference_id, description, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_balance_id,
    'refund',
    p_amount,
    v_new_balance,
    p_reference_type,
    p_reference_id,
    p_description,
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- FUNCTION 5: Get token balance summary
-- ================================

CREATE OR REPLACE FUNCTION get_token_balance_summary(p_balance_id TEXT)
RETURNS TABLE (
  total_tokens INT,
  available_tokens INT,
  used_tokens INT,
  expiring_soon INT,
  batches_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.total_tokens,
    tb.available_tokens,
    tb.used_tokens,
    COALESCE(SUM(CASE 
      WHEN batch.expires_at <= NOW() + INTERVAL '7 days' 
        AND batch.expires_at > NOW()
        AND batch.is_expired = false
      THEN batch.remaining_amount 
      ELSE 0 
    END), 0)::INT as expiring_soon,
    COUNT(CASE WHEN batch.remaining_amount > 0 AND batch.is_expired = false THEN 1 END) as batches_count
  FROM token_balances tb
  LEFT JOIN token_batches batch ON batch.balance_id = tb.id
  WHERE tb.id = p_balance_id
  GROUP BY tb.id, tb.total_tokens, tb.available_tokens, tb.used_tokens;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGER 1: Auto-create token balance for new shops
-- ================================

CREATE OR REPLACE FUNCTION create_token_balance_for_shop()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO token_balances (
    id, shop_id, total_tokens, used_tokens, available_tokens,
    created_at, updated_at
  )
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    0,
    0,
    0,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_token_balance ON shops;
CREATE TRIGGER trigger_create_token_balance
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION create_token_balance_for_shop();

-- ================================
-- TRIGGER 2: Add tokens on subscription
-- ================================

CREATE OR REPLACE FUNCTION add_tokens_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_balance_id TEXT;
  v_token_amount INT;
BEGIN
  -- Only add tokens for new active subscriptions or renewals
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR OLD.is_active = false) THEN
    -- Get balance ID for the shop
    SELECT id INTO v_balance_id
    FROM token_balances
    WHERE shop_id = NEW.shop_id;
    
    -- Determine token amount based on package type
    v_token_amount := CASE NEW.package_type
      WHEN 'FREE' THEN 0
      WHEN 'PRO1' THEN 5
      WHEN 'PRO2' THEN 10
      WHEN 'SPECIAL' THEN 20
      ELSE 0
    END;
    
    -- Add tokens if package includes any
    IF v_token_amount > 0 THEN
      PERFORM add_tokens(
        v_balance_id,
        v_token_amount,
        'subscription',
        NEW.id,
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_tokens_on_subscription ON shop_subscriptions;
CREATE TRIGGER trigger_add_tokens_on_subscription
  AFTER INSERT OR UPDATE ON shop_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION add_tokens_on_subscription();

-- ================================
-- TRIGGER 3: Add tokens on purchase
-- ================================

CREATE OR REPLACE FUNCTION add_tokens_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_balance_id TEXT;
BEGIN
  -- Only add tokens when payment is completed
  IF NEW.payment_status = 'completed' AND (TG_OP = 'INSERT' OR OLD.payment_status != 'completed') THEN
    -- Get balance ID for the shop
    SELECT id INTO v_balance_id
    FROM token_balances
    WHERE shop_id = NEW.shop_id;
    
    -- Add purchased tokens
    PERFORM add_tokens(
      v_balance_id,
      NEW.amount,
      'purchase',
      NULL,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_tokens_on_purchase ON token_purchases;
CREATE TRIGGER trigger_add_tokens_on_purchase
  AFTER INSERT OR UPDATE ON token_purchases
  FOR EACH ROW
  EXECUTE FUNCTION add_tokens_on_purchase();

-- ================================
-- INDEXES for Performance
-- ================================

-- Token Batches
CREATE INDEX IF NOT EXISTS idx_token_batches_expiry_check 
  ON token_batches(balance_id, expires_at) 
  WHERE is_expired = false AND remaining_amount > 0;

CREATE INDEX IF NOT EXISTS idx_token_batches_fifo 
  ON token_batches(balance_id, received_at) 
  WHERE is_expired = false AND remaining_amount > 0;

-- Token Transactions
CREATE INDEX IF NOT EXISTS idx_token_transactions_recent 
  ON token_transactions(balance_id, created_at DESC);

-- Comments for documentation
COMMENT ON FUNCTION expire_tokens() IS 'Automatically expire token batches that have passed their expiry date. Should be run daily via cron job.';
COMMENT ON FUNCTION spend_tokens(TEXT, INT, TEXT, TEXT, TEXT) IS 'Spend tokens using FIFO method (First In First Out). Deducts from oldest batches first.';
COMMENT ON FUNCTION add_tokens(TEXT, INT, TEXT, TEXT, TEXT) IS 'Add tokens to a balance. Creates a new batch with 3-month expiry.';
COMMENT ON FUNCTION refund_tokens(TEXT, INT, TEXT, TEXT, TEXT) IS 'Refund tokens back to a balance. Creates a new batch with 3-month expiry.';
COMMENT ON FUNCTION get_token_balance_summary(TEXT) IS 'Get a summary of token balance including expiring tokens and batch count.';
