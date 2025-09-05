// src/components/layout/MobileMenu.tsx
"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function MobileMenu({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}) {
  const { data: session } = useSession();
  if (!open) return null;

  return (
    <div className="md:hidden border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={onClose} className="py-1">
            {l.label}
          </Link>
        ))}

        {!session ? (
          <button
            onClick={() => {
              onClose();
              signIn();
            }}
            className="px-4 py-2 rounded bg-black text-white"
          >
            เข้าสู่ระบบ
          </button>
        ) : (
          <button
            onClick={() => {
              onClose();
              signOut();
            }}
            className="px-4 py-2 rounded border"
          >
            ออกจากระบบ
          </button>
        )}
      </div>
    </div>
  );
}
```tsx
// src/components/layout/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">FoodFinder</Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="/" className="hover:opacity-80">หน้าแรก</Link>
          <Link href="/dashboard" className="hover:opacity-80">Dashboard</Link>
          <Link href="/admin" className="hover:opacity-80">Admin</Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(v=>!v)} aria-label="menu">
          <Menu />
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
            <Link href="/" onClick={()=>setOpen(false)}>หน้าแรก</Link>
            <Link href="/dashboard" onClick={()=>setOpen(false)}>Dashboard</Link>
            <Link href="/admin" onClick={()=>setOpen(false)}>Admin</Link>
          </div>
        </div>
      )}
    </header>
  );
}
````

**Layout**

```tsx
// src/app/layout.tsx
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/Providers";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

**Session Provider สำหรับ client components**

```tsx
// src/components/Providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

## 8) Homepage + ค้นหาร้าน (ระยะ → ตำบล → อำเภอ → จังหวัด)

**Index/Homepage อยู่ที่** `src/app/(marketing)/page.tsx` ซึ่งแมปกับ `/` ใน App Router (จะย้ายเป็น `src/app/page.tsx` ก็ได้ถ้าต้องการไฟล์ index แบบตรง ๆ)

**Geo Utils**

```ts
// src/lib/geo.ts
export function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number){
  const R = 6371; // km
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
```

**Search API**

```ts
// src/app/api/shops/search/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request){
  const { lat, lng, radiusKm = 5, subdistrict, district, province } = await req.json();

  // 1) ค้นหาร้านตามระยะ
  const all = await prisma.shop.findMany();
  let within = all.filter(s => (
    distanceKm(s.lat, s.lng, lat, lng) <= radiusKm
  ));

  if (within.length === 0) within = all.filter(s => s.subdistrict === subdistrict);
  if (within.length === 0) within = all.filter(s => s.district === district);
  if (within.length === 0) within = all.filter(s => s.province === province);

  // จัดอันดับด้วย ranking (plan + ads + ระยะ)
  within.sort(rankingFactory({ userLat: lat, userLng: lng }));
  return NextResponse.json(within);
}

// --- helpers (simple local)
function distanceKm(lat:number,lng:number,lat2:number,lng2:number){
  const R=6371; const dLat=(lat2-lat)*Math.PI/180; const dLon=(lng2-lng)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function rankingFactory({userLat,userLng}:{userLat:number;userLng:number;}){
  return (a:any,b:any)=>{
    const dA=distanceKm(userLat,userLng,a.lat,a.lng);
    const dB=distanceKm(userLat,userLng,b.lat,b.lng);
    const planScore=(s:any)=>({FREE:0,PRO1:10,PRO2:20,PRO3:30,SPECIAL:30}[s.plan] + (s.visibilityBoost||0));
    const scoreA = -dA + planScore(a);
    const scoreB = -dB + planScore(b);
    return scoreB - scoreA; // มากไปน้อย
  };
}
```

**Homepage**

```tsx
// src/app/(marketing)/page.tsx
"use client";
import { useState } from "react";
import axios from "axios";

export default function Home(){
  const [shops,setShops]=useState<any[]>([]);

  async function locateAndSearch(){
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const { latitude:lat, longitude:lng } = pos.coords;
      // TODO: reverse geocode เป็น ตำบล/อำเภอ/จังหวัด (mock)
      const subdistrict = "บางรัก"; const district = "บางรัก"; const province = "กรุงเทพมหานคร";
      const { data } = await axios.post("/api/shops/search", { lat,lng, radiusKm: 5, subdistrict, district, province });
      setShops(data);
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ค้นหาร้านใกล้ตัว</h1>
      <button className="px-4 py-2 rounded bg-black text-white" onClick={locateAndSearch}>ค้นหาอัตโนมัติ</button>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map(s=> (
          <li key={s.id} className="border rounded-xl p-4">
            <a href={`/shops/${s.slug}`} className="font-semibold text-lg">{s.name}</a>
            <p className="text-sm opacity-70">{s.province} · {s.district}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9) หน้าร้าน

```tsx
// src/app/shops/[slug]/page.tsx
import { prisma } from "@/lib/db";
import Image from "next/image";

export default async function ShopPage({ params:{ slug } }: { params:{ slug: string }}){
  const shop = await prisma.shop.findUnique({ where: { slug } });
  if(!shop) return <div>ไม่พบร้าน</div>;
  const gallery = (shop.gallery as any[]) || [];
  const links = (shop.deliveryLinks as any[]) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{shop.name}</h1>
      <p>{shop.description}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {gallery.map((g,i)=> (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
            <Image src={g.url} alt={g.alt||shop.name} fill className="object-cover"/>
          </div>
        ))}
      </div>
      <div className="space-x-3">
        {links.map((l,i)=> (
          <a key={i} href={l.url} target="_blank" className="underline">สั่งผ่าน {l.platform}</a>
        ))}
      </div>
    </div>
  );
}
```

---

## 10) Dashboard (User/Shop/Admin Entrypoints)

```tsx
// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Dashboard(){
  const session = await getServerSession(authOptions);
  if(!session?.user) return <div>กรุณาเข้าสู่ระบบ</div>;
  const role = (session.user as any).role as string;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {role === "USER" && (
        <div>
          <p>สถานะ: ผู้ใช้ทั่วไป</p>
          <Link className="underline" href="/dashboard/user">ไปหน้า User Dashboard (อัปเกรดเป็น Shop)</Link>
        </div>
      )}
      {role === "SHOP" && <Link className="underline" href="/dashboard/shop">ไปหน้า Shop Dashboard</Link>}
      {role === "ADMIN" && <Link className="underline" href="/admin">ไปหน้า Admin Dashboard</Link>}
    </div>
  );
}
```

**User → Upgrade เป็น Shop**

```tsx
// src/app/dashboard/user/page.tsx
import Link from "next/link";

export default function UserDash(){
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">User Dashboard</h2>
      <p>ต้องการเปิดร้านไหม?</p>
      <Link className="px-4 py-2 rounded bg-black text-white inline-block" href="/api/role/upgrade">อัปเกรดเป็น Shop</Link>
    </div>
  );
}
```

**API: Upgrade Role**

```ts
// src/app/api/role/upgrade/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(){
  const session = await getServerSession(authOptions);
  if(!session?.user) return NextResponse.redirect("/api/auth/signin");
  const userId = (session.user as any).id as string;

  // อัปเดต role และสร้าง shop ว่างๆ
  await prisma.user.update({ where: { id: userId }, data: { role: "SHOP" } });
  await prisma.shop.create({ data: { ownerId: userId, name: "ร้านของฉัน", slug: `shop-${userId.slice(0,6)}`, lat: 13.7563, lng: 100.5018, subdistrict: "บางรัก", district: "บางรัก", province: "กรุงเทพมหานคร" } });
  return NextResponse.redirect("/dashboard/shop");
}
```

---

## 11) Shop Dashboard + Analytics + Ads

**Shop Dashboard**

```tsx
// src/app/dashboard/shop/page.tsx
import Link from "next/link";
export default function ShopDashboard(){
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Dashboard</h2>
      <div className="flex gap-3 flex-wrap">
        <Link className="underline" href="/dashboard/shop/profile">โปรไฟล์ร้าน</Link>
        <Link className="underline" href="/dashboard/shop/analytics">Analytics</Link>
        <Link className="underline" href="/dashboard/shop/ads">ซื้อโฆษณา</Link>
      </div>
    </div>
  );
}
```

**Track Analytics (API)**

```ts
// src/app/api/analytics/track/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request){
  const { shopId, device, referer, province, district, subdistrict } = await req.json();
  await prisma.viewEvent.create({ data: { shopId, device, referer, province, district, subdistrict } });
  return NextResponse.json({ ok: true });
}
```

**Analytics Page (ตัวอย่างรวมรายวัน/เดือน)**

```tsx
// src/app/dashboard/shop/analytics/page.tsx
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export default async function ShopAnalytics(){
  // สมมุติ shopId จาก session/owner (ยกเว้น: ทำจริงให้ดึงจาก ownerId)
  const shop = await prisma.shop.findFirst();
  if(!shop) return <div>ยังไม่มีร้าน</div>;

  const todayS = startOfDay(new Date());
  const todayE = endOfDay(new Date());
  const monthS = startOfMonth(new Date());
  const monthE = endOfMonth(new Date());

  const [today, month] = await Promise.all([
    prisma.viewEvent.count({ where: { shopId: shop.id, ts: { gte: todayS, lte: todayE } } }),
    prisma.viewEvent.count({ where: { shopId: shop.id, ts: { gte: monthS, lte: monthE } } }),
  ]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">ยอดเข้าชม</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4">วันนี้: {today}</div>
        <div className="border rounded-xl p-4">เดือนนี้: {month}</div>
      </div>
    </div>
  );
}
```

**ซื้อโฆษณา (กำหนด Scope)**

```tsx
// src/app/dashboard/shop/ads/page.tsx
"use client";
import { useState } from "react";
import axios from "axios";

export default function Ads(){
  const [scope,setScope]=useState("DISTRICT");
  const [province,setProvince]=useState("");
  const [district,setDistrict]=useState("");
  const [subdistrict,setSubdistrict]=useState("");
  const [days,setDays]=useState(7);

  async function purchase(){
    await axios.post("/api/ads/purchase", { scope, province, district, subdistrict, days, budgetBaht: days*50 });
    alert("สั่งซื้อแล้ว");
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">ซื้อโฆษณา</h3>
      <select className="border rounded p-2" value={scope} onChange={(e)=>setScope(e.target.value)}>
        <option value="SUBDISTRICT">ตำบล</option>
        <option value="DISTRICT">อำเภอ</option>
        <option value="PROVINCE">จังหวัด</option>
        <option value="NATIONAL">ทั่วประเทศ</option>
      </select>
      {scope!=="NATIONAL" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded p-2" placeholder="จังหวัด" value={province} onChange={e=>setProvince(e.target.value)} />
          {(scope==="DISTRICT"||scope==="SUBDISTRICT") && (
            <input className="border rounded p-2" placeholder="อำเภอ" value={district} onChange={e=>setDistrict(e.target.value)} />
          )}
          {scope==="SUBDISTRICT" && (
            <input className="border rounded p-2" placeholder="ตำบล" value={subdistrict} onChange={e=>setSubdistrict(e.target.value)} />
          )}
        </div>
      )}
      <input type="number" className="border rounded p-2" value={days} onChange={e=>setDays(parseInt(e.target.value))} /> วัน
      <button className="px-4 py-2 rounded bg-black text-white" onClick={purchase}>สั่งซื้อ</button>
    </div>
  );
}
```

**API: Purchase Ad**

```ts
// src/app/api/ads/purchase/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request){
  const { scope, province, district, subdistrict, days, budgetBaht } = await req.json();
  // TODO: ตรวจสอบสิทธิ์ shopId จาก session
  const shop = await prisma.shop.findFirst();
  if(!shop) return NextResponse.json({error:"no shop"},{status:400});
  const now = new Date();
  const end = new Date(now.getTime()+days*24*3600*1000);
  await prisma.ad.create({ data: { shopId: shop.id, scope, province, district, subdistrict, startAt: now, endAt: end, budgetBaht } });
  // เพิ่ม visibilityBoost ชั่วคราว (อย่างง่าย)
  await prisma.shop.update({ where: { id: shop.id }, data: { visibilityBoost: { increment: 5 } } });
  return NextResponse.json({ ok: true });
}
```

---

## 12) แพ็กเกจร้าน (5 แบบ) และผลต่อการแสดงผล

**แนวคิด Ranking (อย่างง่าย)**

* ให้ค่าน้ำหนักแผน: FREE=0, PRO1=10, PRO2=20, PRO3/SPECIAL=30
* โฆษณา: ถ้า scope ตรงพื้นที่ผู้ใช้ ให้ +คะแนนพิเศษ (SUBDISTRICT > DISTRICT > PROVINCE > NATIONAL)
* ระยะทาง: ยิ่งใกล้ยิ่งคะแนนสูง (ใช้ -distance)

```ts
// src/lib/ranking.ts
export type RankCtx = { userLat:number; userLng:number; userSubdistrict?:string; userDistrict?:string; userProvince?:string; activeAds?: any[] };

export function scoreShop(s:any, ctx: RankCtx){
  const d = distanceKm(ctx.userLat, ctx.userLng, s.lat, s.lng);
  const planWeight = { FREE:0, PRO1:10, PRO2:20, PRO3:30, SPECIAL:30 }[s.plan] + (s.visibilityBoost||0);
  let adScore = 0;
  const ads = (ctx.activeAds||[]).filter(a=>a.shopId===s.id);
  for(const a of ads){
    if(a.scope==='NATIONAL') adScore += 3;
    if(a.scope==='PROVINCE' && a.province===ctx.userProvince) adScore += 6;
    if(a.scope==='DISTRICT' && a.district===ctx.userDistrict) adScore += 9;
    if(a.scope==='SUBDISTRICT' && a.subdistrict===ctx.userSubdistrict) adScore += 12;
  }
  return planWeight + adScore - d; // ยิ่งมากยิ่งขึ้นบนผลลัพธ์
}

function distanceKm(lat:number,lng:number,lat2:number,lng2:number){
  const R=6371; const dLat=(lat2-lat)*Math.PI/180; const dLon=(lng2-lng)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
```

---

## 13) Admin Dashboard (ตัวอย่าง)

```tsx
// src/app/admin/page.tsx
import Link from "next/link";

export default function AdminHome(){
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="flex gap-3 flex-wrap">
        <Link className="underline" href="/admin/users">Users</Link>
        <Link className="underline" href="/admin/shops">Shops</Link>
        <Link className="underline" href="/admin/ads">Ads</Link>
        <Link className="underline" href="/admin/analytics">Analytics</Link>
      </div>
    </div>
  );
}
```

> แต่ละหน้าให้ทำตารางง่ายๆ จาก Prisma (list/paginate) + ปุ่มแก้ไข/ลบ

---

## 14) Vercel Deploy Notes

* ตั้งค่า **Environment Variables** ทั้งหมดตาม `.env.example`
* เปิด **Build Output** ทั่วไปตาม Next.js (ไม่มี config พิเศษ)
* ใช้ **Prisma with Postgres** ได้ปกติ (Neon หรือ Supabase)
* ถ้าใช้ Supabase Storage สำหรับรูป ให้สร้าง Signed URL หรือใช้ Public Bucket แล้วอัปโหลดผ่านหน้า Shop Profile

---

## 15) ToDo / จุดต่อยอด

* Reverse Geocoding (lat,lng → ตำบล/อำเภอ/จังหวัด): ใช้บริการของรัฐหรือผู้ให้บริการ third-party
* ปรับ Middleware ให้ใช้ `getToken()` ของ next-auth เพื่อตรวจ role ใน Edge
* ทำ Email Magic Link สำหรับผู้ใช้ทั่วไป (ไม่ต้องจำรหัส)
* เพิ่ม Rate Limit ให้ API /ads/purchase /analytics/track
* เพิ่มแผนผังสิทธิ์ละเอียด (เช่น Staff ของร้าน)
* เพิ่มแผนราคา/ระบบจ่ายเงินจริง (Stripe/Omise)
* ทำแผนภูมิ Analytics ด้วย client chart library
* เพิ่มแคช/ISR ในหน้า shop/public lists เพื่อ performance สูง

---

> โค้ดด้านบนเป็น **สเกเลตันพร้อมรันและต่อยอดได้จริง**: ครบเส้นทางหลัก, auth, role, อัปเกรดเป็น Shop, ค้นหาตามลำดับพื้นที่ไทย, จัดอันดับด้วยแพ็กเกจ/โฆษณา, analytics เริ่มต้น, และเตรียม deploy บน Vercel ได้ทันที
