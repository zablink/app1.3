// app/upgrade/reviewer/page.tsx
// หน้าสมัครเป็น Creator/Reviewer - ฉบับสมบูรณ์
// Features: 
// - Multi-step form with validation
// - GPS location picker
// - Multiple coverage areas (up to 5)
// - Dropdown province > amphure > tambon
// - SweetAlert2 for validation
// - Real-time name duplicate check

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  MapPin,
  Phone,
  User,
  Youtube,
  Facebook,
  Instagram,
  Music,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Navigation,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Link as LinkIcon,
} from "lucide-react";

// ============================================================
// INTERFACES
// ============================================================

interface Province {
  id: number;
  name_th: string;
  name_en: string;
}

interface Amphure {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
}

interface Tambon {
  id: number;
  name_th: string;
  name_en: string;
  amphure_id: number;
  zip_code: string | null;
}

interface CoverageArea {
  id: string;
  provinceId: number;
  provinceName: string;
  amphureId?: number;
  amphureName?: string;
  tambonId?: number;
  tambonName?: string;
  level: "province" | "amphure" | "tambon";
}

interface FormData {
  displayName: string;
  bio: string;
  phone: string;
  coverageAreas: CoverageArea[];
  hasExperience: boolean;
  priceRangeMin: string;
  priceRangeMax: string;
  socialMedia: {
    youtube?: { url: string; subscribers: string };
    facebook?: { url: string; followers: string };
    instagram?: { url: string; followers: string };
    tiktok?: { url: string; followers: string };
  };
  portfolioLinks: string[];
  agreedToTerms: boolean;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReviewerApplicationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ============================================================
  // STATES
  // ============================================================

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    displayName: "",
    bio: "",
    phone: "",
    coverageAreas: [],
    hasExperience: true,
    priceRangeMin: "",
    priceRangeMax: "",
    socialMedia: {},
    portfolioLinks: [""],
    agreedToTerms: false,
  });

  // Location Data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);

  // GPS States
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    province?: Province;
    amphure?: Amphure;
    possibleTambons?: Tambon[];
  } | null>(null);
  const [showTambonOptions, setShowTambonOptions] = useState(false);

  // Temporary states for adding new area
  const [tempProvince, setTempProvince] = useState("");
  const [tempAmphure, setTempAmphure] = useState("");
  const [tempTambon, setTempTambon] = useState("");
  const [tempLevel, setTempLevel] = useState<"province" | "amphure" | "tambon">("tambon");

  // ============================================================
  // EFFECTS
  // ============================================================

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Check name availability with debounce
  useEffect(() => {
    if (!formData.displayName || formData.displayName.length < 3) {
      setNameAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkNameAvailability(formData.displayName);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.displayName]);

  // ============================================================
  // API FUNCTIONS
  // ============================================================

  const loadProvinces = async () => {
    try {
      const res = await fetch("/api/locations/provinces");
      const data = await res.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error loading provinces:", error);
    }
  };

  const loadAmphures = async (provinceId: number) => {
    try {
      const res = await fetch(`/api/locations/amphures?provinceId=${provinceId}`);
      const data = await res.json();
      setAmphures(data);
    } catch (error) {
      console.error("Error loading amphures:", error);
    }
  };

  const loadTambons = async (amphureId: number) => {
    try {
      const res = await fetch(`/api/locations/tambons?amphureId=${amphureId}`);
      const data = await res.json();
      setTambons(data);
    } catch (error) {
      console.error("Error loading tambons:", error);
    }
  };

  const checkNameAvailability = async (name: string) => {
    setIsCheckingName(true);
    try {
      const res = await fetch(`/api/creator/check-name?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setNameAvailable(data.available);
    } catch (error) {
      console.error("Error checking name:", error);
      setNameAvailable(null);
    } finally {
      setIsCheckingName(false);
    }
  };

  // ============================================================
  // GPS FUNCTIONS
  // ============================================================

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "ไม่รองรับ GPS",
        text: "เบราว์เซอร์ของคุณไม่รองรับการใช้งาน GPS",
      });
      return;
    }

    setIsLoadingGPS(true);
    setShowTambonOptions(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const res = await fetch("/api/locations/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          const data = await res.json();

          if (data.possibleTambons && data.possibleTambons.length > 0) {
            setGpsLocation({
              lat: latitude,
              lng: longitude,
              province: data.province,
              amphure: data.amphure,
              possibleTambons: data.possibleTambons,
            });
            setShowTambonOptions(true);
          } else {
            Swal.fire({
              icon: "warning",
              title: "ไม่พบข้อมูลพื้นที่",
              text: "ไม่สามารถหาตำบลจาก GPS ได้ กรุณาเลือกพื้นที่ด้วยตนเอง",
            });
          }
        } catch (error) {
          console.error("GPS Error:", error);
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "ไม่สามารถค้นหาพื้นที่จาก GPS ได้",
          });
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (error) => {
        setIsLoadingGPS(false);
        let errorMessage = "ไม่สามารถเข้าถึงตำแหน่งของคุณได้";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "คุณไม่อนุญาตให้เข้าถึงตำแหน่ง กรุณาเปิดการอนุญาตในการตั้งค่าเบราว์เซอร์";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "ไม่สามารถหาตำแหน่งได้ กรุณาเปิด GPS และตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
            break;
          case error.TIMEOUT:
            errorMessage = "หมดเวลาในการหาตำแหน่ง กรุณาลองใหม่อีกครั้ง";
            break;
        }

        Swal.fire({
          icon: "error",
          title: "GPS Error",
          text: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleSelectTambonFromGPS = (tambon: Tambon) => {
    if (!gpsLocation) return;

    const province = gpsLocation.province;
    const amphure = gpsLocation.amphure;

    if (!province || !amphure) return;

    const newArea: CoverageArea = {
      id: Date.now().toString(),
      provinceId: province.id,
      provinceName: province.name_th,
      amphureId: amphure.id,
      amphureName: amphure.name_th,
      tambonId: tambon.id,
      tambonName: tambon.name_th,
      level: "tambon",
    };

    setFormData({
      ...formData,
      coverageAreas: [...formData.coverageAreas, newArea],
    });

    setShowTambonOptions(false);
    setGpsLocation(null);

    Swal.fire({
      icon: "success",
      title: "เพิ่มพื้นที่สำเร็จ",
      text: `${tambon.name_th}, ${amphure.name_th}, ${province.name_th}`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // ============================================================
  // MANUAL AREA SELECTION
  // ============================================================

  const handleProvinceChange = async (provinceId: string) => {
    setTempProvince(provinceId);
    setTempAmphure("");
    setTempTambon("");
    setAmphures([]);
    setTambons([]);

    if (provinceId) {
      await loadAmphures(parseInt(provinceId));
    }
  };

  const handleAmphureChange = async (amphureId: string) => {
    setTempAmphure(amphureId);
    setTempTambon("");
    setTambons([]);

    if (amphureId) {
      await loadTambons(parseInt(amphureId));
    }
  };

  const handleAddCoverageArea = () => {
    if (!tempProvince) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกจังหวัด",
        text: "กรุณาเลือกจังหวัดอย่างน้อย 1 จังหวัด",
      });
      return;
    }

    if (formData.coverageAreas.length >= 5) {
      Swal.fire({
        icon: "warning",
        title: "เพิ่มพื้นที่ไม่ได้",
        text: "คุณสามารถเพิ่มพื้นที่ได้สูงสุด 5 พื้นที่เท่านั้น",
      });
      return;
    }

    const province = provinces.find((p) => p.id === parseInt(tempProvince));
    if (!province) return;

    let newArea: CoverageArea;

    if (tempLevel === "province") {
      newArea = {
        id: Date.now().toString(),
        provinceId: province.id,
        provinceName: province.name_th,
        level: "province",
      };
    } else if (tempLevel === "amphure" && tempAmphure) {
      const amphure = amphures.find((a) => a.id === parseInt(tempAmphure));
      if (!amphure) return;

      newArea = {
        id: Date.now().toString(),
        provinceId: province.id,
        provinceName: province.name_th,
        amphureId: amphure.id,
        amphureName: amphure.name_th,
        level: "amphure",
      };
    } else if (tempLevel === "tambon" && tempTambon) {
      const amphure = amphures.find((a) => a.id === parseInt(tempAmphure));
      const tambon = tambons.find((t) => t.id === parseInt(tempTambon));
      if (!amphure || !tambon) return;

      newArea = {
        id: Date.now().toString(),
        provinceId: province.id,
        provinceName: province.name_th,
        amphureId: amphure.id,
        amphureName: amphure.name_th,
        tambonId: tambon.id,
        tambonName: tambon.name_th,
        level: "tambon",
      };
    } else {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณาเลือกพื้นที่ให้ครบถ้วน",
      });
      return;
    }

    setFormData({
      ...formData,
      coverageAreas: [...formData.coverageAreas, newArea],
    });

    // Reset temp states
    setTempProvince("");
    setTempAmphure("");
    setTempTambon("");
    setAmphures([]);
    setTambons([]);

    Swal.fire({
      icon: "success",
      title: "เพิ่มพื้นที่สำเร็จ",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleRemoveCoverageArea = (id: string) => {
    setFormData({
      ...formData,
      coverageAreas: formData.coverageAreas.filter((area) => area.id !== id),
    });
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.displayName || formData.displayName.length < 3) {
          Swal.fire({
            icon: "warning",
            title: "ข้อมูลไม่ครบถ้วน",
            text: "กรุณากรอกชื่อที่แสดง (อย่างน้อย 3 ตัวอักษร)",
          });
          return false;
        }
        if (nameAvailable === false) {
          Swal.fire({
            icon: "error",
            title: "ชื่อนี้ถูกใช้งานแล้ว",
            text: "กรุณาเลือกชื่ออื่น",
          });
          return false;
        }
        if (!formData.bio || formData.bio.length < 20) {
          Swal.fire({
            icon: "warning",
            title: "ข้อมูลไม่ครบถ้วน",
            text: "กรุณากรอกแนะนำตัว (อย่างน้อย 20 ตัวอักษร)",
          });
          return false;
        }
        if (!formData.phone || formData.phone.length < 10) {
          Swal.fire({
            icon: "warning",
            title: "ข้อมูลไม่ครบถ้วน",
            text: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง",
          });
          return false;
        }
        return true;

      case 2:
        if (formData.coverageAreas.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "ยังไม่ได้เลือกพื้นที่",
            text: "กรุณาเลือกพื้นที่ที่ให้บริการอย่างน้อย 1 พื้นที่",
          });
          return false;
        }
        return true;

      case 3:
        if (formData.hasExperience) {
          if (!formData.priceRangeMin || !formData.priceRangeMax) {
            Swal.fire({
              icon: "warning",
              title: "ข้อมูลไม่ครบถ้วน",
              text: "กรุณากรอกช่วงราคาที่รับงาน",
            });
            return false;
          }

          const min = parseInt(formData.priceRangeMin);
          const max = parseInt(formData.priceRangeMax);

          if (min <= 0 || max <= 0) {
            Swal.fire({
              icon: "warning",
              title: "ราคาไม่ถูกต้อง",
              text: "กรุณากรอกราคาที่มากกว่า 0",
            });
            return false;
          }

          if (min > max) {
            Swal.fire({
              icon: "warning",
              title: "ราคาไม่ถูกต้อง",
              text: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด",
            });
            return false;
          }
        }

        const socialLinks = Object.values(formData.socialMedia).filter((s) => s?.url);
        if (socialLinks.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "ยังไม่ได้กรอก Social Media",
            text: "กรุณากรอก Social Media อย่างน้อย 1 ช่องทาง",
          });
          return false;
        }

        return true;

      case 4:
        if (!formData.agreedToTerms) {
          Swal.fire({
            icon: "warning",
            title: "กรุณายอมรับเงื่อนไข",
            text: "กรุณายอมรับเงื่อนไขการให้บริการก่อนส่งคำขอสมัคร",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/creator/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "ส่งคำขอสมัครสำเร็จ!",
          text: "ทีมงานจะตรวจสอบข้อมูลและแจ้งผลภายใน 1-3 วันทำการ",
        });
        router.push("/dashboard");
      } else {
        const error = await res.json();
        throw new Error(error.message || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถส่งคำขอสมัครได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">สมัครเป็น Creator/Reviewer</h1>
          <p className="text-gray-600 mt-2">
            เริ่มต้นสร้างรายได้จากการรีวิวร้านอาหารและสถานที่ท่องเที่ยว
          </p>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step !== 4 ? "flex-1" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step !== 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className={currentStep === 1 ? "text-blue-600 font-medium" : "text-gray-600"}>
                ข้อมูลพื้นฐาน
              </span>
              <span className={currentStep === 2 ? "text-blue-600 font-medium" : "text-gray-600"}>
                พื้นที่ให้บริการ
              </span>
              <span className={currentStep === 3 ? "text-blue-600 font-medium" : "text-gray-600"}>
                ประสบการณ์
              </span>
              <span className={currentStep === 4 ? "text-blue-600 font-medium" : "text-gray-600"}>
                ยืนยัน
              </span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลพื้นฐาน</h2>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อที่แสดง <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ชื่อที่จะแสดงบนโปรไฟล์"
                  />
                  {isCheckingName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!isCheckingName && nameAvailable !== null && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {nameAvailable ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {!isCheckingName && nameAvailable !== null && (
                  <p
                    className={`mt-1 text-sm ${
                      nameAvailable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {nameAvailable ? "✓ ชื่อนี้ใช้งานได้" : "✗ ชื่อนี้ถูกใช้งานแล้ว"}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แนะนำตัว <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="บอกเล่าเกี่ยวกับตัวคุณและประสบการณ์ในการรีวิว (อย่างน้อย 20 ตัวอักษร)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.bio.length} / 500 ตัวอักษร
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                    }
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0812345678"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Coverage Areas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">พื้นที่ให้บริการ</h2>
              <p className="text-sm text-gray-600">
                เลือกพื้นที่ที่คุณสามารถให้บริการได้ (สูงสุด 5 พื้นที่)
              </p>

              {/* GPS Button */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      ใช้ GPS หาพื้นที่อัตโนมัติ
                    </p>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      disabled={isLoadingGPS || formData.coverageAreas.length >= 5}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      {isLoadingGPS ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังหาตำแหน่ง...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4" />
                          <span>ใช้ GPS เพิ่มพื้นที่</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* GPS Tambon Options */}
              {showTambonOptions && gpsLocation?.possibleTambons && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-3">
                    พบ {gpsLocation.possibleTambons.length} ตำบลในบริเวณนี้ - กรุณาเลือกตำบลที่ถูกต้อง:
                  </p>
                  <div className="space-y-2">
                    {gpsLocation.possibleTambons.map((tambon) => (
                      <button
                        key={tambon.id}
                        type="button"
                        onClick={() => handleSelectTambonFromGPS(tambon)}
                        className="w-full text-left px-4 py-3 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-50 transition"
                      >
                        <p className="font-medium text-gray-900">{tambon.name_th}</p>
                        <p className="text-sm text-gray-600">
                          {gpsLocation.amphure?.name_th}, {gpsLocation.province?.name_th}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Selection */}
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-4">หรือเลือกพื้นที่ด้วยตนเอง</p>

                {/* Coverage Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับพื้นที่
                  </label>
                  <select
                    value={tempLevel}
                    onChange={(e) =>
                      setTempLevel(e.target.value as "province" | "amphure" | "tambon")
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="province">ทั้งจังหวัด</option>
                    <option value="amphure">เฉพาะอำเภอ</option>
                    <option value="tambon">เฉพาะตำบล</option>
                  </select>
                </div>

                {/* Province */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tempProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amphure */}
                {(tempLevel === "amphure" || tempLevel === "tambon") && tempProvince && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อำเภอ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={tempAmphure}
                      onChange={(e) => handleAmphureChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={amphures.length === 0}
                    >
                      <option value="">เลือกอำเภอ</option>
                      {amphures.map((amphure) => (
                        <option key={amphure.id} value={amphure.id}>
                          {amphure.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tambon */}
                {tempLevel === "tambon" && tempAmphure && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ตำบล <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={tempTambon}
                      onChange={(e) => setTempTambon(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={tambons.length === 0}
                    >
                      <option value="">เลือกตำบล</option>
                      {tambons.map((tambon) => (
                        <option key={tambon.id} value={tambon.id}>
                          {tambon.name_th}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddCoverageArea}
                  disabled={formData.coverageAreas.length >= 5}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มพื้นที่</span>
                </button>
              </div>

              {/* Selected Areas */}
              {formData.coverageAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    พื้นที่ที่เลือก ({formData.coverageAreas.length}/5)
                  </p>
                  <div className="space-y-2">
                    {formData.coverageAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {area.level === "province" && `ทั้งจังหวัด${area.provinceName}`}
                            {area.level === "amphure" &&
                              `อำเภอ${area.amphureName}, ${area.provinceName}`}
                            {area.level === "tambon" &&
                              `ตำบล${area.tambonName}, อ.${area.amphureName}, จ.${area.provinceName}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {area.level === "province" && "ครอบคลุมทั้งจังหวัด"}
                            {area.level === "amphure" && "ครอบคลุมทั้งอำเภอ"}
                            {area.level === "tambon" && "เฉพาะตำบล"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoverageArea(area.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Experience & Social */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">ประสบการณ์และ Social Media</h2>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  คุณเคยรับงานรีวิวมาก่อนหรือไม่?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasExperience: true })}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition ${
                      formData.hasExperience
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    เคย - มีประสบการณ์
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        hasExperience: false,
                        priceRangeMin: "",
                        priceRangeMax: "",
                      })
                    }
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition ${
                      !formData.hasExperience
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    ไม่เคย - เพิ่งเริ่มต้น
                  </button>
                </div>
              </div>

              {/* Price Range (if has experience) */}
              {formData.hasExperience && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-4">
                    ช่วงราคาที่คุณเคยรับงาน (บาท) <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">ราคาต่ำสุด</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={formData.priceRangeMin}
                          onChange={(e) =>
                            setFormData({ ...formData, priceRangeMin: e.target.value })
                          }
                          className="pl-9 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="500"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">ราคาสูงสุด</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={formData.priceRangeMax}
                          onChange={(e) =>
                            setFormData({ ...formData, priceRangeMax: e.target.value })
                          }
                          className="pl-9 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="2000"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Admin จะเป็นผู้กำหนดราคาจริงหลังจากอนุมัติ
                  </p>
                </div>
              )}

              {/* Social Media */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-4">
                  Social Media <span className="text-red-500">*</span>
                  <span className="text-gray-600 font-normal ml-2">
                    (กรอกอย่างน้อย 1 ช่องทาง)
                  </span>
                </p>

                <div className="space-y-4">
                  {/* YouTube */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Youtube className="w-5 h-5 text-red-600" />
                      <span className="font-medium">YouTube</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={formData.socialMedia.youtube?.url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: {
                              ...formData.socialMedia,
                              youtube: {
                                ...formData.socialMedia.youtube,
                                url: e.target.value,
                                subscribers:
                                  formData.socialMedia.youtube?.subscribers || "",
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://youtube.com/@yourchannel"
                      />
                      {formData.socialMedia.youtube?.url && (
                        <input
                          type="text"
                          value={formData.socialMedia.youtube?.subscribers || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socialMedia: {
                                ...formData.socialMedia,
                                youtube: {
                                  ...formData.socialMedia.youtube,
                                  url: formData.socialMedia.youtube?.url || "",
                                  subscribers: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="จำนวนผู้ติดตาม (เช่น 10K)"
                        />
                      )}
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Facebook</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={formData.socialMedia.facebook?.url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: {
                              ...formData.socialMedia,
                              facebook: {
                                ...formData.socialMedia.facebook,
                                url: e.target.value,
                                followers:
                                  formData.socialMedia.facebook?.followers || "",
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://facebook.com/yourpage"
                      />
                      {formData.socialMedia.facebook?.url && (
                        <input
                          type="text"
                          value={formData.socialMedia.facebook?.followers || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socialMedia: {
                                ...formData.socialMedia,
                                facebook: {
                                  ...formData.socialMedia.facebook,
                                  url: formData.socialMedia.facebook?.url || "",
                                  followers: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="จำนวนผู้ติดตาม (เช่น 5K)"
                        />
                      )}
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={formData.socialMedia.instagram?.url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: {
                              ...formData.socialMedia,
                              instagram: {
                                ...formData.socialMedia.instagram,
                                url: e.target.value,
                                followers:
                                  formData.socialMedia.instagram?.followers || "",
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://instagram.com/yourusername"
                      />
                      {formData.socialMedia.instagram?.url && (
                        <input
                          type="text"
                          value={formData.socialMedia.instagram?.followers || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socialMedia: {
                                ...formData.socialMedia,
                                instagram: {
                                  ...formData.socialMedia.instagram,
                                  url: formData.socialMedia.instagram?.url || "",
                                  followers: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="จำนวนผู้ติดตาม (เช่น 3K)"
                        />
                      )}
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Music className="w-5 h-5 text-gray-900" />
                      <span className="font-medium">TikTok</span>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={formData.socialMedia.tiktok?.url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: {
                              ...formData.socialMedia,
                              tiktok: {
                                ...formData.socialMedia.tiktok,
                                url: e.target.value,
                                followers:
                                  formData.socialMedia.tiktok?.followers || "",
                              },
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://tiktok.com/@yourusername"
                      />
                      {formData.socialMedia.tiktok?.url && (
                        <input
                          type="text"
                          value={formData.socialMedia.tiktok?.followers || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              socialMedia: {
                                ...formData.socialMedia,
                                tiktok: {
                                  ...formData.socialMedia.tiktok,
                                  url: formData.socialMedia.tiktok?.url || "",
                                  followers: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="จำนวนผู้ติดตาม (เช่น 15K)"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Links */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  ลิงก์ผลงาน (ถ้ามี)
                </p>
                <div className="space-y-3">
                  {formData.portfolioLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...formData.portfolioLinks];
                            newLinks[index] = e.target.value;
                            setFormData({ ...formData, portfolioLinks: newLinks });
                          }}
                          className="pl-9 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/my-review"
                        />
                      </div>
                      {formData.portfolioLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLinks = formData.portfolioLinks.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, portfolioLinks: newLinks });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.portfolioLinks.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          portfolioLinks: [...formData.portfolioLinks, ""],
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มลิงก์ผลงาน</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">ยืนยันข้อมูล</h2>

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ชื่อที่แสดง</p>
                  <p className="font-medium text-gray-900">{formData.displayName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="font-medium text-gray-900">{formData.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">พื้นที่ให้บริการ</p>
                  <ul className="mt-2 space-y-1">
                    {formData.coverageAreas.map((area) => (
                      <li key={area.id} className="text-sm text-gray-900">
                        • {area.level === "province" && `ทั้งจังหวัด${area.provinceName}`}
                        {area.level === "amphure" &&
                          `อำเภอ${area.amphureName}, ${area.provinceName}`}
                        {area.level === "tambon" &&
                          `${area.tambonName}, ${area.amphureName}, ${area.provinceName}`}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm text-gray-600">ประสบการณ์</p>
                  <p className="font-medium text-gray-900">
                    {formData.hasExperience ? "มีประสบการณ์" : "เพิ่งเริ่มต้น"}
                  </p>
                  {formData.hasExperience && formData.priceRangeMin && formData.priceRangeMax && (
                    <p className="text-sm text-gray-700 mt-1">
                      ช่วงราคาที่เคยรับ: {formData.priceRangeMin} - {formData.priceRangeMax} บาท
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Social Media</p>
                  <ul className="mt-2 space-y-1">
                    {formData.socialMedia.youtube?.url && (
                      <li className="text-sm text-gray-900">• YouTube</li>
                    )}
                    {formData.socialMedia.facebook?.url && (
                      <li className="text-sm text-gray-900">• Facebook</li>
                    )}
                    {formData.socialMedia.instagram?.url && (
                      <li className="text-sm text-gray-900">• Instagram</li>
                    )}
                    {formData.socialMedia.tiktok?.url && (
                      <li className="text-sm text-gray-900">• TikTok</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-gray-300 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, agreedToTerms: e.target.checked })
                    }
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      ข้าพเจ้ายอมรับ{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        เงื่อนไขการให้บริการ
                      </a>{" "}
                      และ{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        นโยบายความเป็นส่วนตัว
                      </a>{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ข้อมูลของคุณจะถูกตรวจสอบโดยทีมงาน และแจ้งผลภายใน 1-3 วันทำการ
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.agreedToTerms}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังส่งคำขอ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ส่งคำขอสมัคร</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
