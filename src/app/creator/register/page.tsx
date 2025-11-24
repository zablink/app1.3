// app/creator/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Video, User, MapPin, Phone, Check } from "lucide-react";

interface Province {
  id: number;
  name_th: string;
}

interface Amphure {
  id: number;
  name_th: string;
}

interface Tambon {
  id: number;
  name_th: string;
}

export default function CreatorRegisterPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [error, setError] = useState("");
  const [userInteracted, setUserInteracted] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    lineId: "",
    tiktokUrl: "",
    youtubeUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    provinceId: "",
    amphureId: "",
    tambonId: "",
    coverageLevel: "amphure", // tambon, amphure, province
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Check user role only once when authenticated
  useEffect(() => {
    const checkCreatorStatus = async () => {
      // Only check when we have a valid session
      if (status === "authenticated" && session?.user && !hasCheckedRole) {
        const userRole = (session.user as any)?.role;
        console.log("🔍 Checking user role:", userRole, "hasCheckedRole:", hasCheckedRole);
        setHasCheckedRole(true);
        
        if (userRole === "CREATOR") {
          console.log("⚠️ User has CREATOR role, checking if creator exists...");
          // Check if creator actually exists in database
          try {
            const response = await fetch('/api/creators/my-creator');
            if (response.ok) {
              const data = await response.json();
              if (data.creator) {
                console.log("✅ Creator exists, redirecting to dashboard");
                router.push("/dashboard/creator");
              } else {
                console.log("⚠️ Creator doesn't exist, allowing registration to continue");
              }
            } else {
              console.log("⚠️ Creator doesn't exist, allowing registration to continue");
            }
          } catch (error) {
            console.log("⚠️ Error checking creator, allowing registration to continue");
          }
        } else {
          console.log("✅ User can register as CREATOR, current role:", userRole);
        }
      }
    };
    
    checkCreatorStatus();
  }, [status, hasCheckedRole, router, session?.user]);

  // Fetch provinces
  useEffect(() => {
    if (status === "authenticated" && provinces.length === 0) {
      fetchProvinces();
    }
  }, [status, provinces.length]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/locations?type=provinces");
      const data = await res.json();
      setProvinces(data.data || []);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const fetchAmphures = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/locations?type=amphures&provinceId=${provinceId}`);
      const data = await res.json();
      setAmphures(data.data || []);
      setTambons([]);
    } catch (error) {
      console.error("Error fetching amphures:", error);
    }
  };

  const fetchTambons = async (amphureId: string) => {
    try {
      const res = await fetch(`/api/locations?type=tambons&amphureId=${amphureId}`);
      const data = await res.json();
      setTambons(data.data || []);
    } catch (error) {
      console.error("Error fetching tambons:", error);
    }
  };

  const handleProvinceChange = (provinceId: string) => {
    setFormData({
      ...formData,
      provinceId,
      amphureId: "",
      tambonId: "",
    });
    if (provinceId) {
      fetchAmphures(provinceId);
    } else {
      setAmphures([]);
      setTambons([]);
    }
  };

  const handleAmphureChange = (amphureId: string) => {
    setFormData({
      ...formData,
      amphureId,
      tambonId: "",
    });
    if (amphureId) {
      fetchTambons(amphureId);
    } else {
      setTambons([]);
    }
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // ข้อมูลส่วนตัว
        if (!formData.displayName || formData.displayName.trim().length < 3) {
          setError("กรุณากรอกชื่อที่ใช้แสดงอย่างน้อย 3 ตัวอักษร");
          return false;
        }
        if (!formData.bio || formData.bio.trim().length < 20) {
          setError("กรุณากรอกประวัติส่วนตัวอย่างน้อย 20 ตัวอักษร");
          return false;
        }
        if (!formData.phone || formData.phone.trim().length < 9) {
          setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง");
          return false;
        }
        break;
      
      case 2: // โซเชียลมีเดีย
        // At least one social media should be provided
        if (!formData.tiktokUrl && !formData.youtubeUrl && !formData.facebookUrl && !formData.instagramUrl) {
          setError("กรุณากรอกลิงก์โซเชียลมีเดียอย่างน้อย 1 ช่องทาง");
          return false;
        }
        break;
      
      case 3: // พื้นที่บริการ
        if (!formData.provinceId) {
          setError("กรุณาเลือกจังหวัด");
          return false;
        }
        if (!formData.amphureId) {
          setError("กรุณาเลือกอำเภอ");
          return false;
        }
        if (!formData.tambonId) {
          setError("กรุณาเลือกตำบล");
          return false;
        }
        break;
    }
    
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this is a real user interaction (not automated)
    if (!userInteracted) {
      setError("กรุณากรอกข้อมูลและกดปุ่มด้วยตัวเอง");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/creator/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Show success and redirecting message
      setIsRedirecting(true);
      setError("");
      
      // Update session to reflect new role
      await update();
      
      // Wait a bit for session to update then redirect
      setTimeout(() => {
        router.push("/dashboard/creator");
      }, 500);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัคร");
      setIsRedirecting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "ข้อมูลส่วนตัว" },
    { number: 2, title: "โซเชียลมีเดีย" },
    { number: 3, title: "พื้นที่บริการ" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">✅ ลงทะเบียนสำเร็จ!</p>
          <p className="text-gray-500 text-sm mt-2">กำลังนำคุณไปยังหน้า Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="text-purple-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            สมัครเป็น Content Creator
          </h1>
          <p className="text-gray-600">
            รับงานรีวิวร้านอาหารและสร้างรายได้จากการทำคอนเทนต์
          </p>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.number
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check size={20} />
                    ) : (
                      step.number
                    )}
                  </div>
                  <p className="text-sm mt-2 text-gray-600">{step.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      currentStep > step.number ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-1" size={16} />
                    ชื่อที่แสดง (Display Name) *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => {
                      setUserInteracted(true);
                      setFormData({ ...formData, displayName: e.target.value });
                    }}
                    onFocus={() => setUserInteracted(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="ชื่อที่จะแสดงบนโปรไฟล์"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เกี่ยวกับตัวคุณ
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="บอกเล่าเกี่ยวกับตัวคุณ สไตล์การรีวิว และประสบการณ์"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline mr-1" size={16} />
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="081-234-5678"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LINE ID
                    </label>
                    <input
                      type="text"
                      value={formData.lineId}
                      onChange={(e) =>
                        setFormData({ ...formData, lineId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="@yourlineid"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Social Media */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600 mb-4">
                  กรอกลิงก์โซเชียลมีเดียของคุณ (อย่างน้อย 1 ช่องทาง) *
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={formData.tiktokUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, tiktokUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.tiktok.com/@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={formData.youtubeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, youtubeUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.youtube.com/@channel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.facebookUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, facebookUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.facebook.com/page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.instagramUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, instagramUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://www.instagram.com/username"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Coverage Area */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-800">
                    <MapPin className="inline mr-1" size={16} />
                    เลือกพื้นที่ที่คุณสามารถให้บริการรีวิวได้
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จังหวัด *
                  </label>
                  <select
                    value={formData.provinceId}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อำเภอ/เขต
                  </label>
                  <select
                    value={formData.amphureId}
                    onChange={(e) => handleAmphureChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!formData.provinceId}
                  >
                    <option value="">เลือกอำเภอ/เขต</option>
                    {amphures.map((amphure) => (
                      <option key={amphure.id} value={amphure.id}>
                        {amphure.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตำบล/แขวง
                  </label>
                  <select
                    value={formData.tambonId}
                    onChange={(e) =>
                      setFormData({ ...formData, tambonId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!formData.amphureId}
                  >
                    <option value="">เลือกตำบล/แขวง</option>
                    {tambons.map((tambon) => (
                      <option key={tambon.id} value={tambon.id}>
                        {tambon.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับการให้บริการ *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="tambon"
                        checked={formData.coverageLevel === "tambon"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับตำบล/แขวง</p>
                        <p className="text-sm text-gray-600">
                          รับงานเฉพาะในตำบล/แขวงที่เลือก (พื้นที่เล็กสุด)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="amphure"
                        checked={formData.coverageLevel === "amphure"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับอำเภอ/เขต</p>
                        <p className="text-sm text-gray-600">
                          รับงานทั้งอำเภอ/เขตที่เลือก (แนะนำ)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="province"
                        checked={formData.coverageLevel === "province"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับจังหวัด</p>
                        <p className="text-sm text-gray-600">
                          รับงานทั้งจังหวัดที่เลือก (พื้นที่กว้าง)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">สรุปข้อมูล</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อที่แสดง:</span>
                      <span className="font-medium">{formData.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เบอร์โทร:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">จังหวัด:</span>
                      <span className="font-medium">
                        {provinces.find((p) => p.id === parseInt(formData.provinceId))?.name_th}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ระดับบริการ:</span>
                      <span className="font-medium">
                        {formData.coverageLevel === "tambon" && "ตำบล/แขวง"}
                        {formData.coverageLevel === "amphure" && "อำเภอ/เขต"}
                        {formData.coverageLevel === "province" && "จังหวัด"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ หลังจากสมัครแล้ว ทีมงานจะตรวจสอบข้อมูลภายใน 1-3 วันทำการ 
                    คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อบัญชีได้รับการอนุมัติ
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ย้อนกลับ
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  ถัดไป
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setUserInteracted(true)}
                  onMouseDown={() => setUserInteracted(true)}
                  onTouchStart={() => setUserInteracted(true)}
                  className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "กำลังสมัคร..." : "ยืนยันการสมัคร"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}