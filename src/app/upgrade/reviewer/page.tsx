// app/upgrade/reviewer/page.tsx
// หน้าสมัครเป็น Reviewer พร้อมระบุราคาที่เคยรับงาน

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Video,
  DollarSign,
  TrendingUp,
  Shield,
  MapPin,
  Phone,
  User,
  FileText,
  Youtube,
  Facebook,
  Instagram,
  Music,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function UpgradeReviewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form State
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic Info
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [coverageLevel, setCoverageLevel] = useState("tambon");
  const [provinceId, setProvinceId] = useState("");
  const [amphureId, setAmphureId] = useState("");
  const [tambonId, setTambonId] = useState("");

  // Step 1: Pricing Experience (NEW)
  const [noExperience, setNoExperience] = useState(false);
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");

  // Step 2: Social Media
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Step 3: Portfolio
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  const validateStep1 = () => {
    if (!displayName || !phone || !coverageLevel) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return false;
    }

    // Validate pricing
    if (!noExperience) {
      if (!priceRangeMin || !priceRangeMax) {
        alert("กรุณากรอกช่วงราคาที่เคยรับงาน หรือเลือก 'ไม่เคยรับงาน'");
        return false;
      }

      const min = parseInt(priceRangeMin);
      const max = parseInt(priceRangeMax);

      if (min < 0 || max < 0) {
        alert("ราคาต้องมากกว่าหรือเท่ากับ 0");
        return false;
      }

      if (min > max) {
        alert("ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด");
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    if (!youtube && !facebook && !instagram && !tiktok) {
      alert("กรุณาระบุ Social Media อย่างน้อย 1 ช่องทาง");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/creator/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          phone,
          coverageLevel,
          provinceId,
          amphureId,
          tambonId,
          socialMedia: {
            youtube,
            facebook,
            instagram,
            tiktok,
          },
          portfolioLinks: portfolioLinks.filter((link) => link),
          hasExperience: !noExperience,
          priceRangeMin: noExperience ? null : priceRangeMin,
          priceRangeMax: noExperience ? null : priceRangeMax,
        }),
      });

      if (res.ok) {
        alert(
          "✅ ส่งคำขอสมัครเรียบร้อยแล้ว! กรุณารอการอนุมัติจากทีมงาน (1-3 วันทำการ)"
        );
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
            <Video className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            สมัครเป็นนักรีวิว
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            เริ่มสร้างรายได้จากการรีวิวร้านอาหาร
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      step > s ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
            <span>ข้อมูลพื้นฐาน</span>
            <span className="ml-8">Social Media</span>
            <span className="ml-8">ตรวจสอบ</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ข้อมูลพื้นฐาน
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อที่แสดง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="ชื่อที่จะแสดงในโปรไฟล์"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำตัว
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="แนะนำตัวคุณสั้นๆ และประสบการณ์ในการรีวิว..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0812345678"
                />
              </div>

              {/* Pricing Experience Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💰 ประสบการณ์การรับงานรีวิว
                </h3>

                <div className="space-y-4">
                  {/* No Experience Checkbox */}
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="noExperience"
                      checked={noExperience}
                      onChange={(e) => {
                        setNoExperience(e.target.checked);
                        if (e.target.checked) {
                          setPriceRangeMin("");
                          setPriceRangeMax("");
                        }
                      }}
                      className="mt-1"
                    />
                    <label
                      htmlFor="noExperience"
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium text-gray-900">
                        ฉันไม่เคยรับงานรีวิวที่ได้รับค่าตอบแทนมาก่อน
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        (เหมาะสำหรับผู้เริ่มต้นที่ต้องการสร้างพอร์ตโฟลิโอ)
                      </p>
                    </label>
                  </div>

                  {/* Price Range - Show only if has experience */}
                  {!noExperience && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700">
                        ช่วงราคาที่เคยรับงานรีวิว (บาท/งาน){" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="ราคาต่ำสุด"
                            min="0"
                            step="100"
                            value={priceRangeMin}
                            onChange={(e) => setPriceRangeMin(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>

                        <span className="text-gray-500 font-medium">ถึง</span>

                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="ราคาสูงสุด"
                            min="0"
                            step="100"
                            value={priceRangeMax}
                            onChange={(e) => setPriceRangeMax(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <p className="text-sm text-gray-500">
                        💡 ตัวอย่าง: ถ้าเคยรับงานตั้งแต่ 3,000-5,000 บาทต่องาน
                      </p>

                      {/* Suggested Price Ranges */}
                      <div className="space-y-2">
                        <span className="text-sm text-gray-600">
                          ช่วงราคาที่ผู้ใช้นิยม:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { min: 500, max: 1000, label: "500-1K" },
                            { min: 1000, max: 3000, label: "1K-3K" },
                            { min: 3000, max: 5000, label: "3K-5K" },
                            { min: 5000, max: 10000, label: "5K-10K" },
                            { min: 10000, max: 20000, label: "10K-20K" },
                          ].map((range) => (
                            <button
                              key={range.label}
                              type="button"
                              onClick={() => {
                                setPriceRangeMin(range.min.toString());
                                setPriceRangeMax(range.max.toString());
                              }}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-500 transition"
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                    <div className="flex-1 text-sm text-yellow-800">
                      <p className="font-medium mb-1">
                        ทำไมต้องบอกราคาที่เคยรับ?
                      </p>
                      <p>
                        ข้อมูลนี้จะช่วยทีมงานกำหนดราคาที่เหมาะสมกับประสบการณ์ของคุณ
                        และช่วยให้ร้านค้าเลือก reviewer ได้ตรงกับงบประมาณ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Social Media */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Social Media
              </h2>
              <p className="text-gray-600 mb-6">
                กรุณาระบุ Social Media อย่างน้อย 1 ช่องทาง
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Youtube className="inline mr-2" size={18} />
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://youtube.com/@yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Facebook className="inline mr-2" size={18} />
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Instagram className="inline mr-2" size={18} />
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Music className="inline mr-2" size={18} />
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ตรวจสอบข้อมูล
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">ข้อมูลพื้นฐาน</h3>
                  <p>
                    <strong>ชื่อ:</strong> {displayName}
                  </p>
                  <p>
                    <strong>เบอร์โทร:</strong> {phone}
                  </p>
                  {bio && (
                    <p>
                      <strong>คำแนะนำตัว:</strong> {bio}
                    </p>
                  )}
                </div>

                {/* Pricing Display */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <DollarSign size={20} className="mr-2" />
                    ประสบการณ์และราคา
                  </h3>
                  {noExperience ? (
                    <p className="text-gray-700">
                      ยังไม่เคยรับงานรีวิวที่ได้รับค่าตอบแทนมาก่อน
                    </p>
                  ) : (
                    <p className="text-gray-700">
                      เคยรับงานในช่วงราคา:{" "}
                      <span className="font-semibold text-blue-600">
                        ฿{parseInt(priceRangeMin).toLocaleString()} - ฿
                        {parseInt(priceRangeMax).toLocaleString()}
                      </span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    💡 ทีมงานจะกำหนดราคาที่เหมาะสมให้คุณหลังจากอนุมัติ
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Social Media</h3>
                  {youtube && (
                    <p>
                      <strong>YouTube:</strong> {youtube}
                    </p>
                  )}
                  {facebook && (
                    <p>
                      <strong>Facebook:</strong> {facebook}
                    </p>
                  )}
                  {instagram && (
                    <p>
                      <strong>Instagram:</strong> {instagram}
                    </p>
                  )}
                  {tiktok && (
                    <p>
                      <strong>TikTok:</strong> {tiktok}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-600">
                    ฉันยอมรับ
                    <a href="/terms" className="text-blue-600 hover:underline">
                      {" "}
                      ข้อกำหนดและเงื่อนไข
                    </a>{" "}
                    ของ Zablink
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isSubmitting ? "กำลังส่ง..." : "ส่งคำขอสมัคร"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
