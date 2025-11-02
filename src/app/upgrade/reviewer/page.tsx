// src/app/upgrade/reviewer/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Video,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  Check,
  X,
  ArrowRight,
  Youtube,
  Facebook,
  Instagram,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

export default function UpgradeToReviewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    province: "",
    amphure: "",
    tambon: "",
    coverageLevel: "tambon" as "tambon" | "amphure" | "province",
    // Social media
    youtubeUrl: "",
    youtubeSubscribers: "",
    facebookUrl: "",
    facebookFollowers: "",
    instagramUrl: "",
    instagramFollowers: "",
    tiktokUrl: "",
    tiktokFollowers: "",
    // Portfolio
    portfolioLinks: ["", "", ""],
    // Agreement
    agreedToTerms: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    // Pre-fill user data if available
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        displayName: session.user.name || "",
      }));
    }
  }, [status, session, router]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.displayName || !formData.bio || !formData.phone) {
      alert("กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน");
      return;
    }

    if (!formData.youtubeUrl && !formData.facebookUrl && !formData.instagramUrl && !formData.tiktokUrl) {
      alert("กรุณากรอก Social Media อย่างน้อย 1 ช่องทาง");
      return;
    }

    if (!formData.agreedToTerms) {
      alert("กรุณายอมรับเงื่อนไขการให้บริการ");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/creator/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("ส่งคำขอสมัครเรียบร้อยแล้ว! รอการอนุมัติจากแอดมิน");
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6">
            <Video className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            สมัครเป็นนักรีวิว
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            เริ่มสร้างรายได้จากการรีวิวร้านอาหาร เข้าถึงร้านค้าหลายร้อยแห่ง
            และสร้างรายได้จากสิ่งที่คุณรัก
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <DollarSign className="text-blue-600" size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">รายได้มั่นคง</h3>
            <p className="text-gray-600 text-sm">
              รับงานรีวิวจากร้านค้าชั้นนำ พร้อมรับค่าตอบแทนที่คุ้มค่า
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <TrendingUp className="text-purple-600" size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">เติบโตไปด้วยกัน</h3>
            <p className="text-gray-600 text-sm">
              เข้าถึงแบรนด์ชั้นนำ สร้างเครือข่าย และพัฒนาตัวเอง
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="text-green-600" size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">ชุมชนนักรีวิว</h3>
            <p className="text-gray-600 text-sm">
              เข้าร่วมชุมชนนักรีวิวมืออาชีพ แชร์ประสบการณ์และเทคนิค
            </p>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {currentStep === 1 && "ข้อมูลพื้นฐาน"}
                {currentStep === 2 && "Social Media"}
                {currentStep === 3 && "ยืนยัน"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl mx-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">ข้อมูลพื้นฐาน</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อที่ใช้แสดง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ชื่อที่จะแสดงในโปรไฟล์"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เกี่ยวกับคุณ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="บอกเล่าเกี่ยวกับตัวคุณ สไตล์การรีวิว และความถนัด..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="089-XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พื้นที่ให้บริการ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จังหวัด"
                  />
                  <input
                    type="text"
                    value={formData.amphure}
                    onChange={(e) =>
                      setFormData({ ...formData, amphure: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="อำเภอ"
                  />
                  <input
                    type="text"
                    value={formData.tambon}
                    onChange={(e) =>
                      setFormData({ ...formData, tambon: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ตำบล"
                  />
                </div>

                <select
                  value={formData.coverageLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coverageLevel: e.target.value as
                        | "tambon"
                        | "amphure"
                        | "province",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tambon">ตำบล (พื้นที่เฉพาะ)</option>
                  <option value="amphure">อำเภอ (พื้นที่กว้าง)</option>
                  <option value="province">จังหวัด (พื้นที่กว้างมาก)</option>
                </select>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ถัดไป
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Social Media */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Social Media</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-800">
                  กรุณากรอกข้อมูล Social Media อย่างน้อย 1 ช่องทาง
                  พร้อมจำนวนผู้ติดตาม
                </p>
              </div>

              {/* YouTube */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="text-red-600" size={20} />
                  YouTube
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="url"
                    value={formData.youtubeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, youtubeUrl: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL"
                  />
                  <input
                    type="number"
                    value={formData.youtubeSubscribers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        youtubeSubscribers: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จำนวน Subscribers"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="text-blue-600" size={20} />
                  Facebook
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="url"
                    value={formData.facebookUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, facebookUrl: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL"
                  />
                  <input
                    type="number"
                    value={formData.facebookFollowers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facebookFollowers: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จำนวน Followers"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="text-pink-600" size={20} />
                  Instagram
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramUrl: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL"
                  />
                  <input
                    type="number"
                    value={formData.instagramFollowers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instagramFollowers: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จำนวน Followers"
                  />
                </div>
              </div>

              {/* TikTok */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Video className="text-gray-900" size={20} />
                  TikTok
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="url"
                    value={formData.tiktokUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, tiktokUrl: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="URL"
                  />
                  <input
                    type="number"
                    value={formData.tiktokFollowers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tiktokFollowers: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จำนวน Followers"
                  />
                </div>
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ลิงก์ผลงานรีวิว (ถ้ามี)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  แชร์ลิงก์ผลงานรีวิวที่ดีที่สุดของคุณ (สูงสุด 3 ลิงก์)
                </p>
                {formData.portfolioLinks.map((link, index) => (
                  <input
                    key={index}
                    type="url"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...formData.portfolioLinks];
                      newLinks[index] = e.target.value;
                      setFormData({ ...formData, portfolioLinks: newLinks });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                    placeholder={`ลิงก์ผลงาน ${index + 1}`}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ถัดไป
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">ตรวจสอบข้อมูล</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ชื่อที่ใช้แสดง</p>
                  <p className="text-lg font-semibold">{formData.displayName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">เกี่ยวกับคุณ</p>
                  <p className="text-gray-900">{formData.bio}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">พื้นที่ให้บริการ</p>
                  <p className="text-gray-900">
                    {formData.tambon} {formData.amphure} {formData.province}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Social Media
                  </p>
                  <div className="space-y-1">
                    {formData.youtubeUrl && (
                      <p className="text-sm text-gray-700">
                        YouTube: {formData.youtubeSubscribers} subscribers
                      </p>
                    )}
                    {formData.facebookUrl && (
                      <p className="text-sm text-gray-700">
                        Facebook: {formData.facebookFollowers} followers
                      </p>
                    )}
                    {formData.instagramUrl && (
                      <p className="text-sm text-gray-700">
                        Instagram: {formData.instagramFollowers} followers
                      </p>
                    )}
                    {formData.tiktokUrl && (
                      <p className="text-sm text-gray-700">
                        TikTok: {formData.tiktokFollowers} followers
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreedToTerms: e.target.checked,
                      })
                    }
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">
                      ยอมรับเงื่อนไขการให้บริการ
                    </p>
                    <p>
                      ฉันยอมรับ
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-blue-600 hover:underline mx-1"
                      >
                        เงื่อนไขการให้บริการ
                      </a>
                      และ
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-blue-600 hover:underline mx-1"
                      >
                        นโยบายความเป็นส่วนตัว
                      </a>
                      ของ Zablink
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.agreedToTerms || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={20} />
                  {isSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอสมัคร"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}