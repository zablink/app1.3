// ไฟล์นี้เป็น reference สำหรับเพิ่ม bulk actions
// ให้คัดลอกส่วนที่ต้องการไปใส่ใน page.tsx จริง

// เพิ่ม state สำหรับ bulk selection:
const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
const [showBulkActionsBar, setShowBulkActionsBar] = useState(false);
const [bulkAction, setBulkAction] = useState<'categories' | 'package' | 'status' | 'approve' | 'reject' | 'mockup' | null>(null);

// เพิ่ม handlers สำหรับ bulk selection:
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    setSelectedShopIds(filteredShops.map(s => s.id));
  } else {
    setSelectedShopIds([]);
  }
};

const handleSelectShop = (shopId: string, checked: boolean) => {
  if (checked) {
    setSelectedShopIds([...selectedShopIds, shopId]);
  } else {
    setSelectedShopIds(selectedShopIds.filter(id => id !== shopId));
  }
};

// เพิ่ม bulk action handlers:
const handleBulkUpdateCategories = async () => {
  try {
    const res = await fetch('/api/admin/shops/bulk-update-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shopIds: selectedShopIds,
        categoryIds: selectedCategoryIds 
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(`อัปเดตหมวดหมู่ ${selectedShopIds.length} ร้านสำเร็จ!`, 'success');
      setBulkAction(null);
      setSelectedShopIds([]);
      loadShops(); // Reload to get updated data
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    console.error('Error bulk updating categories:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
};

const handleBulkAssignPackage = async () => {
  try {
    const res = await fetch('/api/admin/shops/bulk-assign-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shopIds: selectedShopIds,
        packageId: selectedPackageId,
        tokenAmount: parseInt(tokenAmount) || 0,
        subscriptionDays: parseInt(subscriptionDays) || 30,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(`มอบหมาย Package ให้ ${selectedShopIds.length} ร้านสำเร็จ!`, 'success');
      setBulkAction(null);
      setSelectedShopIds([]);
      loadShops();
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    console.error('Error bulk assigning package:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
};

const handleBulkChangeStatus = async (newStatus: string) => {
  try {
    const res = await fetch('/api/admin/shops/bulk-update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shopIds: selectedShopIds,
        status: newStatus 
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(`เปลี่ยนสถานะ ${selectedShopIds.length} ร้านสำเร็จ!`, 'success');
      setBulkAction(null);
      setSelectedShopIds([]);
      loadShops();
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    console.error('Error bulk changing status:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
};

const handleBulkToggleMockup = async (isMockup: boolean) => {
  try {
    const res = await fetch('/api/admin/shops/bulk-toggle-mockup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shopIds: selectedShopIds,
        isMockup 
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast(`${isMockup ? 'ทำเครื่องหมาย' : 'ยกเลิก'} DEMO ${selectedShopIds.length} ร้านสำเร็จ!`, 'success');
      setSelectedShopIds([]);
      loadShops();
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    console.error('Error bulk toggling mockup:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
  }
};
