import Link from "next/link";

export const metadata = {
  title: "นโยบายทางธุรกิจ - Zablink",
  description: "นโยบายทางธุรกิจของ Zablink สำหรับการใช้บริการและการซื้อแพ็กเกจ",
};

export default function BusinessPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            ← กลับหน้าแรก
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">นโยบายทางธุรกิจ</h1>
          <p className="text-gray-600 mt-2">อัปเดตล่าสุด: 17 มีนาคม 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. ขอบเขตการให้บริการ</h2>
            <p className="text-gray-700 leading-relaxed">
              Zablink เป็นแพลตฟอร์มสำหรับเชื่อมต่อร้านอาหาร ผู้บริโภค และผู้ใช้งานสายคอนเทนต์
              โดยบริการอาจรวมถึงการลงทะเบียนร้านค้า แพ็กเกจสมาชิก การซื้อ Token และบริการโฆษณา
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. การซื้อแพ็กเกจและ Token</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ราคาที่แสดงบนเว็บไซต์อาจมีการเปลี่ยนแปลงได้ตามนโยบายบริษัท</li>
              <li>ระบบจะยืนยันราคาและสิทธิ์ใช้งานจากฝั่งเซิร์ฟเวอร์เท่านั้น</li>
              <li>การซื้อแพ็กเกจ/Token ต้องใช้ข้อมูลร้านค้าที่ถูกต้องและบัญชีผู้ใช้งานที่ยืนยันแล้ว</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. การใช้งานที่เหมาะสม</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>ห้ามใช้ระบบในลักษณะที่ผิดกฎหมาย หลอกลวง หรือทำลายชื่อเสียงของผู้อื่น</li>
              <li>ห้ามพยายามดัดแปลงราคา สิทธิประโยชน์ หรือข้อมูลธุรกรรมจากฝั่ง client</li>
              <li>หากพบการใช้งานผิดปกติ เราอาจระงับบัญชีหรือธุรกรรมชั่วคราวเพื่อตรวจสอบ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. การเปลี่ยนแปลงนโยบาย</h2>
            <p className="text-gray-700 leading-relaxed">
              บริษัทขอสงวนสิทธิ์ในการปรับปรุงนโยบายทางธุรกิจนี้ได้ตลอดเวลา
              เมื่อมีการเปลี่ยนแปลงสำคัญ จะมีการประกาศบนเว็บไซต์หรือผ่านช่องทางติดต่อที่เหมาะสม
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. ติดต่อเรา</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>อีเมล:</strong> support@zablink.com</p>
              <p><strong>เว็บไซต์:</strong> www.zablink.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

