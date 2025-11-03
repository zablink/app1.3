// src/app/upgrade/reviewer/page.tsx (Complete All Steps)
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

export default function UpgradeToReviewerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [gpsAttempts, setGpsAttempts] = useState(0);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [gpsError, setGpsError] = useState<GPSError | null>(null);
  const [showTambonOptions, setShowTambonOptions] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    provinceName: string;
    amphureName: string;
    tambonName: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
    provinceId: "",
    amphureId: "",
    tambonId: "",
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
      console.log('🔄 Fetching provinces...');
      const res = await fetch("/api/locations?type=provinces");
      
      if (!res.ok) {
        console.error('❌ Failed to fetch provinces:', res.status);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Provinces loaded:', data.data?.length || 0);
      setProvinces(data.data || []);
    } catch (error) {
      console.error("❌ Error fetching provinces:", error);
    }
  };

  useEffect(() => {
    if (formData.provinceId) {
      fetchAmphures(formData.provinceId);
    } else {
      setAmphures([]);
      setTambons([]);
    }
  }, [formData.provinceId]);

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
    if (formData.amphureId) {
      fetchTambons(formData.amphureId);
    } else {
      setTambons([]);
    }
  }, [formData.amphureId]);

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

  useEffect(() => {
    if (formData.provinceId && formData.amphureId && formData.tambonId) {
      const province = provinces.find(p => p.id.toString() === formData.provinceId);
      const amphure = amphures.find(a => a.id.toString() === formData.amphureId);
      const tambon = tambons.find(t => t.id.toString() === formData.tambonId);
      
      if (province && amphure && tambon) {
        setSelectedLocation({
          provinceName: province.name_th,
          amphureName: amphure.name_th,
          tambonName: tambon.name_th,
        });
      }
    } else {
      setSelectedLocation(null);
    }
  }, [formData.provinceId, formData.amphureId, formData.tambonId, provinces, amphures, tambons]);

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

        const DEFAULT_LAT = 13.7367;
        const DEFAULT_LNG = 100.5231;
        const isDefaultLocation = 
          Math.abs(latitude - DEFAULT_LAT) < 0.001 && 
          Math.abs(longitude - DEFAULT_LNG) < 0.001;

        if (isDefaultLocation) {
          setGpsError({
            type: 'position_unavailable',
            message: "ตำแหน่งที่ได้รับอาจไม่ถูกต้อง กรุณาลองใหม่หรือเลือกด้วยตนเอง"
          });
          setIsLoadingGPS(false);
          return;
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
              await updateLocationFromGPS(data.location);
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

        let errorType: GPSError['type'] = 'position_unavailable';
        let errorMessage = "ไม่สามารถเข้าถึงตำแหน่งของคุณได้";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'permission_denied';
            errorMessage = "คุณไม่อนุญาตให้เข้าถึงตำแหน่ง";
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'position_unavailable';
            errorMessage = "ไม่สามารถหาตำแหน่งได้";
            break;
          case error.TIMEOUT:
            errorType = 'timeout';
            errorMessage = "หมดเวลาในการหาตำแหน่ง";
            break;
        }

        setGpsError({ type: errorType, message: errorMessage });
      },
      options
    );
  };

  const updateLocationFromGPS = async (location: any) => {
    const provinceId = location.province.id.toString();
    setFormData(prev => ({
      ...prev,
      provinceId: provinceId,
      amphureId: "",
      tambonId: "",
    }));

    try {
      const amphuresRes = await fetch(`/api/locations?type=amphures&provinceId=${provinceId}`);
      const amphuresData = await amphuresRes.json();
      setAmphures(amphuresData.data || []);
      
      const amphureId = location.amphure.id.toString();
      setFormData(prev => ({
        ...prev,
        amphureId: amphureId,
        tambonId: "",
      }));

      const tambonsRes = await fetch(`/api/locations?type=tambons&amphureId=${amphureId}`);
      const tambonsData = await tambonsRes.json();
      setTambons(tambonsData.data || []);
      
      const tambonId = location.tambon.id.toString();
      setFormData(prev => ({
        ...prev,
        tambonId: tambonId,
      }));

      setSelectedLocation({
        provinceName: location.province.name_th,
        amphureName: location.amphure.name_th,
        tambonName: location.tambon.name_th,
      });

      // ✅ ลบ alert ออกแล้ว - ใช้ UI แสดงแทน
      
    } catch (error) {
      console.error('❌ Error updating location:', error);
    }
  };

  const handleSelectTambon = async (tambon: Tambon) => {
    if (gpsLocation) {
      await updateLocationFromGPS({
        province: gpsLocation.province,
        amphure: gpsLocation.amphure,
        tambon: tambon,
      });
      
      setShowTambonOptions(false);
      setGpsError(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.bio || !formData.phone) {
      alert("กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วน");
      return;
    }
    if (!formData.provinceId) {
      alert("กรุณาเลือกพื้นที่ให้บริการ");
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
        alert("ส่งคำขอสมัครเรียบร้อยแล้ว!");
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("เกิดข้อผิดพลาด");
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

              {/* Location Selection */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    พื้นที่ให้บริการ <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUseGPS}
                      disabled={isLoadingGPS}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {isLoadingGPS ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          กำลังหา... ({gpsAttempts})
                        </>
                      ) : (
                        <>
                          <Navigation size={18} />
                          ใช้ GPS
                        </>
                      )}
                    </button>
                    {gpsError && (
                      <button
                        type="button"
                        onClick={() => setShowManualSelection(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                      >
                        <MapPin size={18} />
                        เลือกเอง
                      </button>
                    )}
                  </div>
                </div>

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
                          {gpsError.type === 'permission_denied' && '❌ ไม่อนุญาตให้เข้าถึงตำแหน่ง'}
                          {gpsError.type === 'position_unavailable' && '📍 หาตำแหน่งไม่พบ'}
                          {gpsError.type === 'timeout' && '⏱️ หมดเวลา'}
                          {gpsError.type === 'low_accuracy' && '⚠️ ความแม่นยำต่ำ'}
                        </p>
                        <p className={`text-sm ${
                          gpsError.type === 'low_accuracy' ? 'text-yellow-800' : 'text-red-800'
                        }`}>
                          {gpsError.message}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={handleUseGPS}
                            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            <RefreshCw size={16} />
                            ลองใหม่
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowManualSelection(true);
                              setGpsError(null);
                            }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-700"
                          >
                            เลือกด้วยตนเอง →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                {selectedLocation && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          📍 ตำแหน่งที่เลือก
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedLocation.tambonName}, {selectedLocation.amphureName}, {selectedLocation.provinceName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                          className="w-full text-left px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                        >
                          <p className="font-medium text-gray-900">
                            {tambon.name_th}
                          </p>
                          <p className="text-sm text-gray-600">
                            {gpsLocation.amphure?.name_th}, {gpsLocation.province?.name_th}
                            {tambon.zip_code && ` (${tambon.zip_code})`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(showManualSelection || !gpsLocation || provinces.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จังหวัด
                      </label>
                      <select
                        value={formData.provinceId}
                        onChange={(e) => {
                          setFormData({ ...formData, provinceId: e.target.value, amphureId: "", tambonId: "" });
                        }}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        อำเภอ
                      </label>
                      <select
                        value={formData.amphureId}
                        onChange={(e) => {
                          setFormData({ ...formData, amphureId: e.target.value, tambonId: "" });
                        }}
                        disabled={!formData.provinceId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">เลือกอำเภอ</option>
                        {amphures.map((amphure) => (
                          <option key={amphure.id} value={amphure.id}>
                            {amphure.name_th}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ตำบล
                      </label>
                      <select
                        value={formData.tambonId}
                        onChange={(e) => {
                          setFormData({ ...formData, tambonId: e.target.value });
                        }}
                        disabled={!formData.amphureId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">เลือกตำบล</option>
                        {tambons.map((tambon) => (
                          <option key={tambon.id} value={tambon.id}>
                            {tambon.name_th}
                            {tambon.zip_code && ` (${tambon.zip_code})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ระดับการให้บริการ
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="tambon"
                        checked={formData.coverageLevel === "tambon"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value as "tambon" })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับตำบล</p>
                        <p className="text-sm text-gray-600">
                          รับงานเฉพาะในตำบลที่เลือก
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="amphure"
                        checked={formData.coverageLevel === "amphure"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value as "amphure" })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับอำเภอ</p>
                        <p className="text-sm text-gray-600">
                          รับงานทั้งอำเภอ
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="coverageLevel"
                        value="province"
                        checked={formData.coverageLevel === "province"}
                        onChange={(e) =>
                          setFormData({ ...formData, coverageLevel: e.target.value as "province" })
                        }
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">ระดับจังหวัด</p>
                        <p className="text-sm text-gray-600">
                          รับงานทั้งจังหวัด
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.provinceId}
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
                  <p className="text-sm font-medium text-gray-600">เบอร์โทรศัพท์</p>
                  <p className="text-gray-900">{formData.phone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">พื้นที่ให้บริการ</p>
                  {selectedLocation ? (
                    <>
                      <p className="text-gray-900">
                        {selectedLocation.tambonName}, {selectedLocation.amphureName}, {selectedLocation.provinceName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        ระดับ: {formData.coverageLevel === "tambon" ? "ตำบล" : formData.coverageLevel === "amphure" ? "อำเภอ" : "จังหวัด"}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-900">-</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Social Media
                  </p>
                  <div className="space-y-1">
                    {formData.youtubeUrl && (
                      <p className="text-sm text-gray-700">
                        📺 YouTube: {formData.youtubeSubscribers} subscribers
                      </p>
                    )}
                    {formData.facebookUrl && (
                      <p className="text-sm text-gray-700">
                        👥 Facebook: {formData.facebookFollowers} followers
                      </p>
                    )}
                    {formData.instagramUrl && (
                      <p className="text-sm text-gray-700">
                        📷 Instagram: {formData.instagramFollowers} followers
                      </p>
                    )}
                    {formData.tiktokUrl && (
                      <p className="text-sm text-gray-700">
                        🎵 TikTok: {formData.tiktokFollowers} followers
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