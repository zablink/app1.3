#!/usr/bin/env python3
import sys
import importlib.util
import os
import geopandas as gpd
from shapely import wkt
from prisma import Prisma

# -------------------------
# 1. ตรวจสอบ Python version
# -------------------------
if sys.version_info < (3, 8):
    print("❌ ต้องใช้ Python 3.8 ขึ้นไป")
    sys.exit(1)

# -------------------------
# 2. ตรวจสอบ package
# -------------------------
required_packages = ["geopandas", "shapely", "prisma"]
missing = []
for pkg in required_packages:
    if importlib.util.find_spec(pkg) is None:
        missing.append(pkg)

if missing:
    print("❌ ขาด package:", ", ".join(missing))
    print("👉 ติดตั้งด้วยคำสั่ง: pip install " + " ".join(missing))
    sys.exit(1)

# -------------------------
# 3. Paths
# -------------------------
SHP_FILE = "thai_tambons.shp"  # ใส่ path ของ shapefile
if not os.path.exists(SHP_FILE):
    print(f"❌ ไฟล์ไม่พบ: {SHP_FILE}")
    sys.exit(1)

# -------------------------
# 4. Load shapefile ด้วย GeoPandas
# -------------------------
print("🌱 อ่านไฟล์ shapefile...")
gdf = gpd.read_file(SHP_FILE)

# ตรวจสอบว่าไฟล์มีคอลัมน์สำหรับรหัสตำบล (Tambon ID)
if "id" not in gdf.columns:
    print("❌ shapefile ต้องมีคอลัมน์ 'id' (Tambon ID)")
    sys.exit(1)

print(f"✅ โหลด shapefile แล้ว: {len(gdf)} แถว")

# -------------------------
# 5. Update geometry ลง Prisma
# -------------------------
async def main():
    prisma = Prisma()
    await prisma.connect()

    print("🌱 เริ่มอัพเดต geometry ของ Tambons...")
    for _, row in gdf.iterrows():
        tambon_id = int(row["id"])
        geom_wkt = row["geometry"].wkt if row["geometry"] else None

        await prisma.tambon.update(
            where={"id": tambon_id},
            data={"geom": geom_wkt}
        )

    await prisma.disconnect()
    print("✅ อัพเดต geometry เสร็จสิ้น!")

# -------------------------
# 6. Run
# -------------------------
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
