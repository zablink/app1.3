# Bulk Actions Feature for Admin Shops Page

## สรุปฟีเจอร์ที่เพิ่ม

เพิ่มความสามารถในการจัดการร้านค้าแบบกลุ่ม (bulk actions) ใน admin/shops ได้แก่:

1. ✅ เลือกหลายร้านพร้อมกัน
2. ✅ เปลี่ยนหมวดหมู่แบบกลุ่ม
3. ✅ มอบหมาย Package แบบกลุ่ม
4. ✅ เปลี่ยนสถานะแบบกลุ่ม (APPROVED, PENDING, REJECTED, SUSPENDED)
5. ✅ ทำเครื่องหมาย/ยกเลิก DEMO แบบกลุ่ม

## API Routes ที่สร้างแล้ว

### 1. Bulk Update Categories
**Endpoint:** `POST /api/admin/shops/bulk-update-categories`

**Request Body:**
```json
{
  "shopIds": ["shop_id_1", "shop_id_2", ...],
  "categoryIds": ["category_id_1", "category_id_2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "อัปเดตหมวดหมู่สำหรับ 5 ร้านสำเร็จ",
  "updatedCount": 5
}
```

### 2. Bulk Assign Package
**Endpoint:** `POST /api/admin/shops/bulk-assign-package`

**Request Body:**
```json
{
  "shopIds": ["shop_id_1", "shop_id_2", ...],
  "packageId": "package_id",
  "tokenAmount": 100,
  "subscriptionDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "มอบหมาย Package สำเร็จ 5 ร้าน",
  "successCount": 5,
  "failedCount": 0,
  "results": [...]
}
```

### 3. Bulk Update Status
**Endpoint:** `POST /api/admin/shops/bulk-update-status`

**Request Body:**
```json
{
  "shopIds": ["shop_id_1", "shop_id_2", ...],
  "status": "APPROVED" // or PENDING, REJECTED, SUSPENDED
}
```

**Response:**
```json
{
  "success": true,
  "message": "อัปเดตสถานะเป็น APPROVED สำหรับ 5 ร้านสำเร็จ",
  "updatedCount": 5
}
```

### 4. Bulk Toggle Mockup
**Endpoint:** `POST /api/admin/shops/bulk-toggle-mockup`

**Request Body:**
```json
{
  "shopIds": ["shop_id_1", "shop_id_2", ...],
  "isMockup": true // or false
}
```

**Response:**
```json
{
  "success": true,
  "message": "ทำเครื่องหมาย DEMO สำหรับ 5 ร้านสำเร็จ",
  "updatedCount": 5
}
```

## การเพิ่ม UI Components ใน page.tsx

### Step 1: เพิ่ม State

```typescript
// เพิ่มใน component state
const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
const [bulkAction, setBulkAction] = useState<'categories' | 'package' | 'status' | 'mockup' | null>(null);
const [bulkStatus, setBulkStatus] = useState('APPROVED');
```

### Step 2: เพิ่ม Selection Handlers

```typescript
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
```

### Step 3: เพิ่ม Checkbox Column ในตาราง

```tsx
{/* เพิ่มใน thead */}
<th className="px-6 py-3">
  <input
    type="checkbox"
    checked={selectedShopIds.length === filteredShops.length && filteredShops.length > 0}
    onChange={(e) => handleSelectAll(e.target.checked)}
    className="w-4 h-4 text-orange-600"
  />
</th>

{/* เพิ่มใน tbody สำหรับแต่ละ row */}
<td className="px-6 py-4">
  <input
    type="checkbox"
    checked={selectedShopIds.includes(shop.id)}
    onChange={(e) => handleSelectShop(shop.id, e.target.checked)}
    className="w-4 h-4 text-orange-600"
  />
</td>
```

### Step 4: เพิ่ม Bulk Actions Toolbar

```tsx
{/* แสดงเมื่อมีร้านที่ถูกเลือก */}
{selectedShopIds.length > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl z-40">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">
            เลือก {selectedShopIds.length} ร้าน
          </span>
          <button
            onClick={() => setSelectedShopIds([])}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
          >
            ยกเลิก
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bulk Actions Buttons */}
          <button
            onClick={() => setBulkAction('categories')}
            className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            จัดการหมวดหมู่
          </button>
          
          <button
            onClick={() => setBulkAction('package')}
            className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            มอบหมาย Package
          </button>
          
          <div className="relative group">
            <button className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              เปลี่ยนสถานะ
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-white rounded-lg shadow-xl py-2 min-w-[200px]">
              <button onClick={() => handleBulkChangeStatus('APPROVED')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-green-600">✓ อนุมัติ</button>
              <button onClick={() => handleBulkChangeStatus('PENDING')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-yellow-600">⏳ รออนุมัติ</button>
              <button onClick={() => handleBulkChangeStatus('REJECTED')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600">✗ ปฏิเสธ</button>
              <button onClick={() => handleBulkChangeStatus('SUSPENDED')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-600">⊘ ระงับ</button>
            </div>
          </div>
          
          <button
            onClick={() => handleBulkToggleMockup(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            ทำเครื่องหมาย DEMO
          </button>
          
          <button
            onClick={() => handleBulkToggleMockup(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            ยกเลิก DEMO
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

### Step 5: เพิ่ม Bulk Modals

```tsx
{/* Bulk Categories Modal */}
{bulkAction === 'categories' && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="p-6 border-b">
        <h3 className="text-lg font-bold">จัดการหมวดหมู่ ({selectedShopIds.length} ร้าน)</h3>
      </div>
      <div className="p-6">
        {/* หมวดหมู่ Checkboxes */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allCategories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(cat.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                  } else {
                    setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                  }
                }}
                className="w-4 h-4"
              />
              <span>{cat.icon} {cat.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="p-6 border-t flex gap-3">
        <button
          onClick={() => setBulkAction(null)}
          className="flex-1 px-4 py-2 border rounded-lg"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleBulkUpdateCategories}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          อัปเดต {selectedShopIds.length} ร้าน
        </button>
      </div>
    </div>
  </div>
)}

{/* Bulk Package Modal - คล้ายกับ Categories Modal */}
```

## วิธีการใช้งาน

1. **เลือกร้านค้า**: คลิก checkbox หน้าร้านที่ต้องการ หรือคลิก checkbox ที่ header เพื่อเลือกทั้งหมด
2. **Toolbar ปรากฏขึ้น**: แสดงจำนวนร้านที่เลือกและปุ่ม bulk actions ต่างๆ
3. **เลือก Action**: คลิกปุ่มที่ต้องการ (เปลี่ยนหมวดหมู่, มอบ package, เปลี่ยนสถานะ)
4. **ยืนยันการเปลี่ยนแปลง**: Modal จะเปิดขึ้นให้กำหนดค่า แล้วกดยืนยัน
5. **รอผลลัพธ์**: ระบบจะแสดง Toast notification เมื่อเสร็จสิ้น

## Notes

- ทุก bulk action จะ reload ข้อมูลหลังจากเสร็จสิ้น
- สามารถทำ bulk action ได้ครั้งละหลายร้าน
- มี error handling สำหรับกรณีที่บางร้านอัปเดตไม่สำเร็จ
- UI ใช้ Tailwind CSS และ Lucide React icons

## ไฟล์ที่สร้าง

1. `/api/admin/shops/bulk-update-categories/route.ts` ✅
2. `/api/admin/shops/bulk-assign-package/route.ts` ✅
3. `/api/admin/shops/bulk-update-status/route.ts` ✅
4. `/api/admin/shops/bulk-toggle-mockup/route.ts` ✅

## ต้องแก้ไขไฟล์

- `/app/admin/shops/page.tsx` - เพิ่ม UI components ตามตัวอย่างด้านบน

---

**Created:** 25 November 2025
**Status:** API Routes สร้างเสร็จแล้ว, รอเพิ่ม UI components
