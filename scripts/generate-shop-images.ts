// scripts/generate-shop-images.ts
// Script to query shops from database and generate food images based on shop names

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// For CommonJS compatibility
declare const __filename: string;
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'public', 'images', 'shops');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created directory: ${outputDir}`);
}

/**
 * Generate image using OpenAI DALL-E API
 */
async function generateImageWithDALLE(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ DALL-E API error: ${response.status} - ${error}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    
    if (!imageUrl) {
      console.error('❌ No image URL in DALL-E response');
      return null;
    }

    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`❌ Failed to download image: ${imageResponse.status}`);
      return null;
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('❌ Error generating image with DALL-E:', error);
    return null;
  }
}

/**
 * Generate image using Stable Diffusion API (Hugging Face)
 */
async function generateImageWithStableDiffusion(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Stable Diffusion API error: ${response.status} - ${error}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error('❌ Error generating image with Stable Diffusion:', error);
    return null;
  }
}

/**
 * Create a placeholder image (simple colored image with text)
 * This is a fallback when no API is available
 */
function createPlaceholderImage(shopName: string): string {
  // This is a simple SVG placeholder - in production you might want to use canvas or a library
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffa500;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="middle">
        ${shopName}
      </text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="32" 
            fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
        🍽️ อาหารไทย
      </text>
    </svg>
  `;
  return Buffer.from(svg).toString('base64');
}

/**
 * Save image to file
 */
function saveImage(base64Data: string, filename: string): boolean {
  try {
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    console.log(`✅ Saved: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save ${filename}:`, error);
    return false;
  }
}

/**
 * Sanitize filename (remove special characters)
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9ก-๙\s-]/g, '') // Keep only alphanumeric, Thai chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase()
    .substring(0, 100); // Limit length
}

/**
 * Generate prompt for food image based on shop name
 */
function generateFoodPrompt(shopName: string, description?: string | null): string {
  // Extract keywords from shop name and description
  const keywords = [shopName];
  if (description) {
    keywords.push(description);
  }

  // Common Thai food keywords
  const thaiFoodKeywords = [
    'อาหารไทย', 'Thai food', 'delicious', 'appetizing', 'professional food photography',
    'restaurant quality', 'high quality', 'food styling', 'gourmet'
  ];

  // Build prompt
  let prompt = `A beautiful, appetizing photo of ${shopName}`;
  
  // Add description context if available
  if (description && description.length < 100) {
    prompt += ` - ${description}`;
  }
  
  prompt += `. ${thaiFoodKeywords.join(', ')}. Professional food photography, high quality, appetizing, restaurant style.`;

  return prompt;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting shop image generation...\n');

  // Check for API keys
  const openaiKey = process.env.OPENAI_API_KEY;
  const huggingfaceKey = process.env.HUGGINGFACE_API_KEY;
  
  const useDALLE = !!openaiKey;
  const useStableDiffusion = !!huggingfaceKey && !useDALLE;
  const usePlaceholder = !useDALLE && !useStableDiffusion;

  console.log('📋 Configuration:');
  console.log(`   - OpenAI DALL-E: ${useDALLE ? '✅ Available' : '❌ Not configured'}`);
  console.log(`   - Stable Diffusion: ${useStableDiffusion ? '✅ Available' : '❌ Not configured'}`);
  console.log(`   - Placeholder: ${usePlaceholder ? '⚠️ Will use placeholder images' : ''}`);
  console.log(`   - Output directory: ${outputDir}\n`);

  if (usePlaceholder) {
    console.log('⚠️  No API keys found. Using placeholder images.');
    console.log('💡 To generate real images, set OPENAI_API_KEY or HUGGINGFACE_API_KEY in .env\n');
  }

  try {
    // Query shops from database (similar to page.tsx)
    console.log('📊 Querying shops from database...');
    
    const shops = await prisma.shop.findMany({
      where: {
        OR: [
          { status: 'APPROVED' },
          { status: null }, // Include shops without status
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true, // Check if image already exists
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${shops.length} shops\n`);

    if (shops.length === 0) {
      console.log('⚠️  No shops found. Exiting.');
      return;
    }

    // Process each shop
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < shops.length; i++) {
      const shop = shops[i];
      const index = i + 1;
      
      console.log(`\n[${index}/${shops.length}] Processing: ${shop.name}`);

      // Skip if image already exists in database and file exists
      if (shop.image) {
        const existingImagePath = path.join(projectRoot, 'public', shop.image);
        if (fs.existsSync(existingImagePath)) {
          console.log(`   ⏭️  Skipping - image already exists: ${shop.image}`);
          skipCount++;
          continue;
        }
      }

      // Generate filename
      const filename = `${sanitizeFilename(shop.name)}-${shop.id.substring(0, 8)}.png`;
      const filePath = path.join(outputDir, filename);

      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`   ⏭️  Skipping - file already exists: ${filename}`);
        skipCount++;
        continue;
      }

      // Generate prompt
      const prompt = generateFoodPrompt(shop.name, shop.description);
      console.log(`   📝 Prompt: ${prompt.substring(0, 100)}...`);

      // Generate image
      let imageBase64: string | null = null;

      if (useDALLE) {
        console.log('   🎨 Generating with DALL-E...');
        imageBase64 = await generateImageWithDALLE(prompt, openaiKey!);
      } else if (useStableDiffusion) {
        console.log('   🎨 Generating with Stable Diffusion...');
        imageBase64 = await generateImageWithStableDiffusion(prompt, huggingfaceKey!);
      } else {
        console.log('   🎨 Creating placeholder image...');
        imageBase64 = createPlaceholderImage(shop.name);
      }

      if (!imageBase64) {
        console.log(`   ❌ Failed to generate image`);
        errorCount++;
        continue;
      }

      // Save image
      if (saveImage(imageBase64, filename)) {
        successCount++;
        
        // Optionally update database with image path
        const imagePath = `/images/shops/${filename}`;
        try {
          await prisma.shop.update({
            where: { id: shop.id },
            data: { image: imagePath },
          });
          console.log(`   💾 Updated database with image path: ${imagePath}`);
        } catch (dbError) {
          console.error(`   ⚠️  Failed to update database:`, dbError);
        }
      } else {
        errorCount++;
      }

      // Rate limiting - wait between requests to avoid API limits
      if ((useDALLE || useStableDiffusion) && i < shops.length - 1) {
        const delay = useDALLE ? 2000 : 1000; // DALL-E is slower, wait 2s; SD wait 1s
        console.log(`   ⏳ Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Output directory: ${outputDir}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
