// src/app/upgrade/reviewer/page.tsx (Final Version with Loading & Multiple Areas)
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
  MapPin,
  Navigation,
  Loader,
  AlertTriangle,
  RefreshCw,
  Target,
  CheckCircle,
  Plus,
} from "lucide-react";

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

interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number;
  province?: Province;
  amphure?: Amphure;
  tambon?: Tambon;
  possibleTambons?: Tambon[];
}

interface GPSError {
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'low_accuracy';
  message: string;
}

interface SelectedArea {
  id: number;
  name: string;
  type: 'province' | 'amphure' | 'tambon';
}

export default function UpgradeToReviewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [isSelectingTambon, setIsSelectingTambon] = useState(false); // ✅ NEW
  const [gpsAttempts, setGpsAttempts] = useState(0);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [gpsError, setGpsError] = useState<GPSError | null>(null);
  const [showTambonOptions, setShowTambonOptions] = useState(false);
  
  // ✅ NEW: Multiple Coverage Areas
  const [coverageAreas, setCoverageAreas] = useState<SelectedArea[]>([]);
  
  // For adding areas manually
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedAmphureId, setSelectedAmphureId] = useState<string>("");
  const [selectedTambonId, setSelectedTambonId] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    coverageLevel: "tambon" as "tambon" | "amphure" | "province",
    youtubeUrl: "",
    youtubeSubscribers: "",
    facebookUrl: "",
    facebookFollowers: "",
    instagramUrl: "",
    instagramFollowers: "",
    tiktokUrl: "",
    tiktokFollowers: "",
    portfolioLinks: ["", "", ""],
    agreedToTerms: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        displayName: session.user.name || "",
      }));
    }
    fetchProvinces();
  }, [status, session, router]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/locations?type=provinces");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProvinces(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching provinces:", error);
    }
  };

  useEffect(() => {
    if (selectedProvinceId && formData.coverageLevel !== 'province') {
      fetchAmphures(selectedProvinceId);
    }
  }, [selectedProvinceId, formData.coverageLevel]);

  const fetchAmphures = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/locations?type=amphures&provinceId=${provinceId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAmphures(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching amphures:", error);
      setAmphures([]);
    }
  };

  useEffect(() => {
    if (selectedAmphureId && formData.coverageLevel === 'tambon') {
      fetchTambons(selectedAmphureId);
    }
  }, [selectedAmphureId, formData.coverageLevel]);

  const fetchTambons = async (amphureId: string) => {
    try {
      const res = await fetch(`/api/locations?type=tambons&amphureId=${amphureId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTambons(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching tambons:", error);
      setTambons([]);
    }
  };

  const handleUseGPS = async () => {
    if (!navigator.geolocation) {
      setGpsError({
        type: 'position_unavailable',
        message: "เบราว์เซอร์ของคุณไม่รองรับการหาตำแหน่ง GPS"
      });
      return;
    }

    setIsLoadingGPS(true);
    setGpsError(null);
    setGpsAttempts(prev => prev + 1);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (accuracy > 100) {
          setGpsError({
            type: 'low_accuracy',
            message: `ความแม่นยำของ GPS ต่ำ (±${Math.round(accuracy)}m)`
          });
        }

        try {
          const res = await fetch("/api/locations/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lat: latitude, 
              lng: longitude,
              accuracy: accuracy 
            }),
          });

          const data = await res.json();

          if (res.ok) {
            const locationData: GPSLocation = {
              ...data.location,
              accuracy: accuracy
            };
            
            setGpsLocation(locationData);

            if (data.location.possibleTambons && data.location.possibleTambons.length > 1) {
              setShowTambonOptions(true);
            } else if (data.location.tambon) {
              await handleSelectTambonFromGPS(data.location);
            }
          } else {
            setGpsError({
              type: 'position_unavailable',
              message: data.error || "ไม่สามารถหาตำแหน่งได้"
            });
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setGpsError({
            type: 'position_unavailable',
            message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
          });
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsLoadingGPS(false);
        
        let errorMessage = "ไม่สามารถเข้าถึงตำแหน่งของคุณได้";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "คุณไม่อนุญาตให้เข้าถึงตำแหน่ง";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "ไม่สามารถหาตำแหน่งได้";
            break;
          case error.TIMEOUT:
            errorMessage = "หมดเวลาในการหาตำแหน่ง";
            break;
        }
        
        setGpsError({ 
          type: error.code === error.PERMISSION_DENIED ? 'permission_denied' : 'position_unavailable', 
          message: errorMessage 
        });
      },
      options
    );
  };

  // ✅ NEW: Handle select tambon from GPS with loading state
  const handleSelectTambonFromGPS = async (location: any) => {
    setIsSelectingTambon(true); // เริ่ม loading
    
    try {
      // Add to coverage areas
      const newArea: SelectedArea = {
        id: location.tambon.id,
        name: `${location.tambon.name_th}, ${location.amphure.name_th}, ${location.province.name_th}`,
        type: 'tambon',
      };
      
      // Check if already selected
      if (!coverageAreas.some(a => a.id === newArea.id && a.type === 'tambon')) {
        setCoverageAreas(prev => [...prev, newArea]);
      }
      
      // Set for form display
      setSelectedProvinceId(location.province.id.toString());
      
      // Load amphures
      await fetchAmphures(location.province.id.toString());
      setSelectedAmphureId(location.amphure.id.toString());
      
      // Load tambons
      await fetchTambons(location.amphure.id.toString());
      setSelectedTambonId(location.tambon.id.toString());
      
      // Clear GPS options
      setShowTambonOptions(false);
      setGpsError(null);
      
      console.log('✅ Added area from GPS:', newArea);
      
    } catch (error) {
      console.error('❌ Error selecting tambon:', error);
    } finally {
      setIsSelectingTambon(false); // เสร็จ loading
    }
  };

  // ✅ Handle select from GPS options (multiple tambons)
  const handleSelectTambon = async (tambon: Tambon) => {
    if (!gpsLocation) return;
    
    setIsSelectingTambon(true); // เริ่ม loading
    
    await handleSelectTambonFromGPS({
      province: gpsLocation.province,
      amphure: gpsLocation.amphure,
      tambon: tambon,
    });
  };

  // ✅ Add area manually
  const handleAddArea = () => {
    if (coverageAreas.length >= 5) {
      alert('เลือกได้สูงสุด 5 พื้นที่');
      return;
    }

    let newArea: SelectedArea | null = null;

    if (formData.coverageLevel === 'province' && selectedProvinceId) {
      const province = provinces.find(p => p.id.toString() === selectedProvinceId);
      if (province) {
        if (coverageAreas.some(a => a.id === province.id && a.type === 'province')) {
          alert('จังหวัดนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: province.id,
          name: province.name_th,
          type: 'province',
        };
      }
    } else if (formData.coverageLevel === 'amphure' && selectedAmphureId) {
      const amphure = amphures.find(a => a.id.toString() === selectedAmphureId);
      const province = provinces.find(p => p.id.toString() === selectedProvinceId);
      if (amphure && province) {
        if (coverageAreas.some(a => a.id === amphure.id && a.type === 'amphure')) {
          alert('อำเภอนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: amphure.id,
          name: `${amphure.name_th}, ${province.name_th}`,
          type: 'amphure',
        };
      }
    } else if (formData.coverageLevel === 'tambon' && selectedTambonId) {
      const tambon = tambons.find(t => t.id.toString() === selectedTambonId);
      const amphure = amphures.find(a => a.id.toString() === selectedAmphureId);
      const province = provinces.find(p => p.id.toString() === selectedProvinceId);
      if (tambon && amphure && province) {
        if (coverageAreas.some(a => a.id === tambon.id && a.type === 'tambon')) {
          alert('ตำบลนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: tambon.id,
          name: `${tambon.name_th}, ${amphure.name_th}, ${province.name_th}`,
          type: 'tambon',
        };
      }
    }

    if (newArea) {
      setCoverageAreas(prev => [...prev, newArea!]);
      // Reset selections
      if (formData.coverageLevel === 'province') {
        setSelectedProvinceId("");
      } else if (formData.coverageLevel === 'amphure') {
        setSelectedAmphureId("");
      } else if (formData.coverageLevel === 'tambon') {
        setSelectedTambonId("");
      }
    }
  };

  // ✅ Remove area
  const handleRemoveArea = (index: number) => {
    setCoverageAreas(prev => prev.filter((_, i) => i !== index));
  };

  // แก้ไขฟังก์ชัน handleSubmit ในไฟล์ page.tsx
// วางทับโค้ดเดิมที่บรรทัดประมาณ 417-441

  const handleSubmit = async () => {
    // Validation
    if (!formData.displayName || !formData.bio || !formData.phone) {
      alert("กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน");
      return;
    }
    if (coverageAreas.length === 0) {
      alert("กรุณาเลือกพื้นที่ที่พร้อมรับงานอย่างน้อย 1 แห่ง");
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
      
      // ✅ Debug: ดู session ก่อนส่ง
      console.log("🚀 [Submit] Current session:", session);
      console.log("🚀 [Submit] User ID:", session?.user?.id);
      
      const res = await fetch("/api/creator/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ สำคัญ! เพิ่มบรรทัดนี้เพื่อส่ง cookies
        body: JSON.stringify({
          ...formData,
          coverageAreas, // ส่ง coverage areas ไปด้วย
        }),
      });

      console.log("✅ [Submit] Response status:", res.status);
      
      const data = await res.json();
      console.log("✅ [Submit] Response data:", data);

      if (res.ok) {
        alert("ส่งคำขอสมัครเรียบร้อยแล้ว! กรุณารอการอนุมัติจากทีมงาน");
        router.push("/dashboard");
      } else {
        alert(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("❌ [Submit] Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
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
            เริ่มสร้างรายได้จากการรีวิวร้านอาหาร
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
              รับงานรีวิวจากร้านค้าชั้นนำ
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <TrendingUp className="text-purple-600" size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">เติบโตไปด้วยกัน</h3>
            <p className="text-gray-600 text-sm">
              เข้าถึงแบรนด์ชั้นนำ สร้างเครือข่าย
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="text-green-600" size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">ชุมชนนักรีวิว</h3>
            <p className="text-gray-600 text-sm">
              เข้าร่วมชุมชนนักรีวิวมืออาชีพ
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
                  placeholder="บอกเล่าเกี่ยวกับตัวคุณ..."
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

              {/* Coverage Level Selection */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ระดับการให้บริการ <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="coverageLevel"
                      value="tambon"
                      checked={formData.coverageLevel === "tambon"}
                      onChange={(e) => {
                        setFormData({ ...formData, coverageLevel: e.target.value as "tambon" });
                        setCoverageAreas([]); // Reset areas when changing level
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">ระดับตำบล</p>
                      <p className="text-sm text-gray-600">
                        รับงานในตำบลที่เลือก (เลือกได้สูงสุด 5 ตำบล)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="coverageLevel"
                      value="amphure"
                      checked={formData.coverageLevel === "amphure"}
                      onChange={(e) => {
                        setFormData({ ...formData, coverageLevel: e.target.value as "amphure" });
                        setCoverageAreas([]);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">ระดับอำเภอ</p>
                      <p className="text-sm text-gray-600">
                        รับงานในอำเภอที่เลือก (เลือกได้สูงสุด 5 อำเภอ)
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="coverageLevel"
                      value="province"
                      checked={formData.coverageLevel === "province"}
                      onChange={(e) => {
                        setFormData({ ...formData, coverageLevel: e.target.value as "province" });
                        setCoverageAreas([]);
                      }}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">ระดับจังหวัด</p>
                      <p className="text-sm text-gray-600">
                        รับงานในจังหวัดที่เลือก (เลือกได้สูงสุด 5 จังหวัด)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* GPS Location or Manual Selection */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    พื้นที่ที่พร้อมรับงาน <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    disabled={isLoadingGPS || coverageAreas.length >= 5}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingGPS ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        กำลังหา...
                      </>
                    ) : (
                      <>
                        <Navigation size={18} />
                        ใช้ GPS เพิ่มพื้นที่
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      เลือกพื้นที่ที่คุณพร้อมรับงาน
                    </p>
                    <p className="text-sm text-blue-800">
                      {formData.coverageLevel === 'province' && `เลือกจังหวัดที่คุณพร้อมรับงาน (สูงสุด 5 จังหวัด)`}
                      {formData.coverageLevel === 'amphure' && `เลือกอำเภอที่คุณพร้อมรับงาน (สูงสุด 5 อำเภอ)`}
                      {formData.coverageLevel === 'tambon' && `เลือกตำบลที่คุณพร้อมรับงาน (สูงสุด 5 ตำบล)`}
                    </p>
                  </div>
                </div>

                {/* GPS Error */}
                {gpsError && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    gpsError.type === 'low_accuracy' 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {gpsError.type === 'low_accuracy' ? (
                        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${
                          gpsError.type === 'low_accuracy' ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          {gpsError.message}
                        </p>
                        <button
                          type="button"
                          onClick={handleUseGPS}
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2"
                        >
                          <RefreshCw size={16} />
                          ลองใหม่
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GPS Accuracy */}
                {gpsLocation && gpsLocation.accuracy && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="text-green-600" size={18} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          ความแม่นยำ GPS: ±{Math.round(gpsLocation.accuracy)} เมตร
                        </p>
                        <div className="w-full bg-green-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.max(10, Math.min(100, 100 - (gpsLocation.accuracy / 100 * 100)))}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GPS Tambon Options - ✅ WITH LOADING STATE */}
                {showTambonOptions && gpsLocation?.possibleTambons && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          พบ {gpsLocation.possibleTambons.length} ตำบลในบริเวณนี้
                        </p>
                        <p className="text-sm text-blue-800">
                          กรุณาเลือกตำบลที่ถูกต้อง:
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {gpsLocation.possibleTambons.map((tambon) => (
                        <button
                          key={tambon.id}
                          type="button"
                          onClick={() => handleSelectTambon(tambon)}
                          disabled={isSelectingTambon}
                          className={`w-full text-left px-4 py-3 bg-white border border-blue-300 rounded-lg transition ${
                            isSelectingTambon 
                              ? 'cursor-wait opacity-70' 
                              : 'hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          {isSelectingTambon ? (
                            <div className="flex items-center gap-2">
                              <Loader size={16} className="animate-spin text-blue-600" />
                              <span className="text-sm text-gray-600">กำลังตั้งค่า...</span>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">
                                {tambon.name_th}
                              </p>
                              <p className="text-sm text-gray-600">
                                {gpsLocation.amphure?.name_th}, {gpsLocation.province?.name_th}
                                {tambon.zip_code && ` (${tambon.zip_code})`}
                              </p>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Selection Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {formData.coverageLevel === 'province' ? (
                    <>
                      <div className="md:col-span-3">
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => setSelectedProvinceId(e.target.value)}
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
                      <button
                        type="button"
                        onClick={handleAddArea}
                        disabled={!selectedProvinceId || coverageAreas.length >= 5}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                        เพิ่ม
                      </button>
                    </>
                  ) : formData.coverageLevel === 'amphure' ? (
                    <>
                      <div>
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedAmphureId("");
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">จังหวัด</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <select
                          value={selectedAmphureId}
                          onChange={(e) => setSelectedAmphureId(e.target.value)}
                          disabled={!selectedProvinceId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">อำเภอ</option>
                          {amphures.map((amphure) => (
                            <option key={amphure.id} value={amphure.id}>
                              {amphure.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddArea}
                        disabled={!selectedAmphureId || coverageAreas.length >= 5}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                        เพิ่ม
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedAmphureId("");
                            setSelectedTambonId("");
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">จังหวัด</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={selectedAmphureId}
                          onChange={(e) => {
                            setSelectedAmphureId(e.target.value);
                            setSelectedTambonId("");
                          }}
                          disabled={!selectedProvinceId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">อำเภอ</option>
                          {amphures.map((amphure) => (
                            <option key={amphure.id} value={amphure.id}>
                              {amphure.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={selectedTambonId}
                          onChange={(e) => setSelectedTambonId(e.target.value)}
                          disabled={!selectedAmphureId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">ตำบล</option>
                          {tambons.map((tambon) => (
                            <option key={tambon.id} value={tambon.id}>
                              {tambon.name_th}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddArea}
                        disabled={!selectedTambonId || coverageAreas.length >= 5}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                        เพิ่ม
                      </button>
                    </>
                  )}
                </div>

                {/* Selected Areas Display */}
                {coverageAreas.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      พื้นที่ที่เลือก ({coverageAreas.length}/5)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {coverageAreas.map((area, index) => (
                        <div
                          key={`${area.type}-${area.id}-${index}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg"
                        >
                          <MapPin size={16} />
                          <span className="text-sm font-medium">{area.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveArea(index)}
                            className="hover:bg-blue-200 rounded-full p-0.5 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Message */}
                {coverageAreas.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ กรุณาเลือกพื้นที่อย่างน้อย 1 แห่ง
                  </p>
                )}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={coverageAreas.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  กรุณากรอกข้อมูล Social Media อย่างน้อย 1 ช่องทาง พร้อมจำนวนผู้ติดตาม
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
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ตรวจสอบข้อมูลก่อนส่ง
                </h2>
                <p className="text-gray-600">
                  กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนส่งคำขอสมัคร
                </p>
              </div>

              {/* ข้อมูลพื้นฐาน */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Check className="text-blue-600" size={20} />
                  ข้อมูลพื้นฐาน
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">ชื่อที่แสดง</p>
                    <p className="font-medium text-gray-900">{formData.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">คำแนะนำตัว</p>
                    <p className="text-gray-700">{formData.bio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                    <p className="font-medium text-gray-900">{formData.phone}</p>
                  </div>
                </div>
              </div>

              {/* พื้นที่รับงาน */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="text-green-600" size={20} />
                  พื้นที่ที่พร้อมรับงาน
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">
                    ระดับการให้บริการ: 
                    <span className="ml-2 font-medium text-gray-900">
                      {formData.coverageLevel === 'province' && 'ทั้งจังหวัด'}
                      {formData.coverageLevel === 'amphure' && 'ระดับอำเภอ'}
                      {formData.coverageLevel === 'tambon' && 'ระดับตำบล'}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {coverageAreas.map((area, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                      >
                        <MapPin size={16} />
                        {area.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Users className="text-purple-600" size={20} />
                  Social Media
                </h3>
                <div className="space-y-4">
                  {formData.youtubeUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Youtube className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">YouTube</p>
                        <a
                          href={formData.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {formData.youtubeUrl}
                        </a>
                        {formData.youtubeSubscribers && (
                          <p className="text-xs text-gray-600 mt-1">
                            {parseInt(formData.youtubeSubscribers).toLocaleString()} subscribers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.facebookUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Facebook className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Facebook</p>
                        <a
                          href={formData.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {formData.facebookUrl}
                        </a>
                        {formData.facebookFollowers && (
                          <p className="text-xs text-gray-600 mt-1">
                            {parseInt(formData.facebookFollowers).toLocaleString()} followers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.instagramUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Instagram className="text-pink-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Instagram</p>
                        <a
                          href={formData.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {formData.instagramUrl}
                        </a>
                        {formData.instagramFollowers && (
                          <p className="text-xs text-gray-600 mt-1">
                            {parseInt(formData.instagramFollowers).toLocaleString()} followers
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.tiktokUrl && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">TikTok</p>
                        <a
                          href={formData.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {formData.tiktokUrl}
                        </a>
                        {formData.tiktokFollowers && (
                          <p className="text-xs text-gray-600 mt-1">
                            {parseInt(formData.tiktokFollowers).toLocaleString()} followers
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Links - ✅ ส่วนที่เพิ่มใหม่! */}
              {formData.portfolioLinks && formData.portfolioLinks.some(link => link.trim() !== '') && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <svg 
                      className="w-5 h-5 text-purple-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    ลิงก์ผลงาน
                  </h3>
                  
                  <div className="space-y-3">
                    {formData.portfolioLinks.map((link, index) => {
                      if (!link || link.trim() === '') return null;
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm"
                            >
                              {link}
                            </a>
                          </div>
                          
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition"
                            title="เปิดในแท็บใหม่"
                          >
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Buttons */}
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
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      กำลังส่งคำขอ...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      ส่งคำขอสมัคร
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}