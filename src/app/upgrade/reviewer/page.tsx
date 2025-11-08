// app/upgrade/reviewer/page.tsx
// หน้าสมัครเป็น Reviewer ฉบับสมบูรณ์
// Features: GPS Picker, Multiple Coverage Areas (5), Name Check, SweetAlert2, Checkbox

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Video,
  DollarSign,
  MapPin,
  Phone,
  User,
  Youtube,
  Facebook,
  Instagram,
  Music,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Navigation,
  Plus,
  Trash2,
} from "lucide-react";

// ======== INTERFACES ========

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

interface SelectedArea {
  provinceId?: number;
  provinceName: string;
  amphureId?: number;
  amphureName?: string;
  tambonId?: number;
  tambonName?: string;
  displayText: string;
}

// ======== DEBOUNCE HOOK ========

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

  // Display Name Check State
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameCheckResult, setNameCheckResult] = useState<{
    available: boolean;
    message: string;
    warning?: boolean;
    similarNames?: Array<{ name: string; similarity: number }>;
  } | null>(null);
  const debouncedDisplayName = useDebounce(displayName, 500);

  // Coverage Areas (Multiple)
  const [coverageLevel, setCoverageLevel] = useState<"tambon" | "amphure" | "province">("tambon");
  const [selectedAreas, setSelectedAreas] = useState<SelectedArea[]>([]);
  const MAX_AREAS = 5;

  // GPS State
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [isSelectingTambon, setIsSelectingTambon] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [showTambonOptions, setShowTambonOptions] = useState(false);
  const [gpsError, setGpsError] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Manual Selection State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedAmphureId, setSelectedAmphureId] = useState("");
  const [selectedTambonId, setSelectedTambonId] = useState("");

  // Pricing Experience
  const [noExperience, setNoExperience] = useState(false);
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");

  // Step 2: Social Media
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Step 3: Terms
  const [acceptTerms, setAcceptTerms] = useState(false);

  // ======== LOAD PROVINCES ========
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/locations/provinces")
      .then((res) => res.json())
      .then((data) => setProvinces(data || []))
      .catch(() => setProvinces([]));
  }, []);

  // ======== LOAD AMPHURES ========
  useEffect(() => {
    if (selectedProvinceId) {
      fetch(`/api/locations/amphures?provinceId=${selectedProvinceId}`)
        .then((res) => res.json())
        .then((data) => setAmphures(data || []))
        .catch(() => setAmphures([]));
      setSelectedAmphureId("");
      setSelectedTambonId("");
    }
  }, [selectedProvinceId]);

  // ======== LOAD TAMBONS ========
  useEffect(() => {
    if (selectedAmphureId) {
      fetch(`/api/locations/tambons?amphureId=${selectedAmphureId}`)
        .then((res) => res.json())
        .then((data) => setTambons(data || []))
        .catch(() => setTambons([]));
      setSelectedTambonId("");
    }
  }, [selectedAmphureId]);

  // ======== CHECK DISPLAY NAME ========
  useEffect(() => {
    const checkDisplayName = async () => {
      if (!debouncedDisplayName || debouncedDisplayName.trim().length < 2) {
        setNameCheckResult(null);
        return;
      }

      setIsCheckingName(true);
      try {
        const response = await fetch(
          `/api/creator/check-displayname?name=${encodeURIComponent(
            debouncedDisplayName.trim()
          )}`
        );
        const data = await response.json();

        if (response.ok) {
          setNameCheckResult(data);
        } else {
          setNameCheckResult(null);
        }
      } catch (error) {
        console.error("Error checking display name:", error);
        setNameCheckResult(null);
      } finally {
        setIsCheckingName(false);
      }
    };

    checkDisplayName();
  }, [debouncedDisplayName]);

  // ======== GPS FUNCTIONS ========

  const handleUseGPS = async () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "GPS ไม่รองรับ",
        text: "เบราว์เซอร์ของคุณไม่รองรับการหาตำแหน่ง GPS",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setIsLoadingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const res = await fetch("/api/locations/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
              accuracy: accuracy,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            const locationData: GPSLocation = {
              lat: latitude,
              lng: longitude,
              accuracy: accuracy,
              ...data.location,
            };

            setGpsLocation(locationData);

            // ถ้ามีหลายตำบล ให้เลือก
            if (data.location.possibleTambons && data.location.possibleTambons.length > 1) {
              setShowTambonOptions(true);
            } else if (data.location.tambon) {
              // ถ้ามีตำบลเดียว เพิ่มทันที
              await handleSelectTambonFromGPS(data.location);
            }
          } else {
            throw new Error(data.error || "ไม่สามารถหาตำแหน่งได้");
          }
        } catch (error: any) {
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถหาตำแหน่งได้",
            text: error.message || "กรุณาลองใหม่อีกครั้ง",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#ef4444",
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
            errorMessage = "คุณไม่อนุญาตให้เข้าถึงตำแหน่ง";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "ไม่สามารถหาตำแหน่งได้";
            break;
          case error.TIMEOUT:
            errorMessage = "หมดเวลาในการหาตำแหน่ง";
            break;
        }

        Swal.fire({
          icon: "error",
          title: "GPS Error",
          text: errorMessage,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#ef4444",
        });
      }
    );
  };

  const handleSelectTambon = async (tambon: Tambon) => {
    if (!gpsLocation) return;

    setIsSelectingTambon(true);

    // Simulate delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    await handleSelectTambonFromGPS({
      province: gpsLocation.province,
      amphure: gpsLocation.amphure,
      tambon: tambon,
    });

    setIsSelectingTambon(false);
  };

  const handleSelectTambonFromGPS = async (location: any) => {
    const newArea: SelectedArea = {
      provinceId: location.province.id,
      provinceName: location.province.name_th,
      amphureId: location.amphure?.id,
      amphureName: location.amphure?.name_th,
      tambonId: location.tambon?.id,
      tambonName: location.tambon?.name_th,
      displayText: getDisplayText(
        coverageLevel,
        location.tambon?.name_th,
        location.amphure?.name_th,
        location.province.name_th
      ),
    };

    // Check duplicate
    const isDuplicate = selectedAreas.some((area) => {
      if (coverageLevel === "tambon") return area.tambonId === newArea.tambonId;
      if (coverageLevel === "amphure") return area.amphureId === newArea.amphureId;
      return area.provinceId === newArea.provinceId;
    });

    if (isDuplicate) {
      Swal.fire({
        icon: "warning",
        title: "พื้นที่ซ้ำ",
        text: "คุณเลือกพื้นที่นี้แล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (selectedAreas.length >= MAX_AREAS) {
      Swal.fire({
        icon: "warning",
        title: "เลือกครบแล้ว",
        text: `คุณสามารถเลือกได้สูงสุด ${MAX_AREAS} พื้นที่`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setSelectedAreas([...selectedAreas, newArea]);
    setShowTambonOptions(false);

    Swal.fire({
      icon: "success",
      title: "เพิ่มพื้นที่สำเร็จ!",
      text: `เพิ่ม ${newArea.displayText} แล้ว`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // ======== MANUAL SELECTION FUNCTIONS ========

  const handleAddManualArea = () => {
    const province = provinces.find((p) => p.id === parseInt(selectedProvinceId));
    const amphure = amphures.find((a) => a.id === parseInt(selectedAmphureId));
    const tambon = tambons.find((t) => t.id === parseInt(selectedTambonId));

    // Validate based on coverage level
    if (coverageLevel === "province" && !province) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกจังหวัด",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (coverageLevel === "amphure" && (!province || !amphure)) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกอำเภอ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (coverageLevel === "tambon" && (!province || !amphure || !tambon)) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกตำบล",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const newArea: SelectedArea = {
      provinceId: province?.id,
      provinceName: province?.name_th || "",
      amphureId: amphure?.id,
      amphureName: amphure?.name_th,
      tambonId: tambon?.id,
      tambonName: tambon?.name_th,
      displayText: getDisplayText(
        coverageLevel,
        tambon?.name_th,
        amphure?.name_th,
        province?.name_th
      ),
    };

    // Check duplicate
    const isDuplicate = selectedAreas.some((area) => {
      if (coverageLevel === "tambon") return area.tambonId === newArea.tambonId;
      if (coverageLevel === "amphure") return area.amphureId === newArea.amphureId;
      return area.provinceId === newArea.provinceId;
    });

    if (isDuplicate) {
      Swal.fire({
        icon: "warning",
        title: "พื้นที่ซ้ำ",
        text: "คุณเลือกพื้นที่นี้แล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (selectedAreas.length >= MAX_AREAS) {
      Swal.fire({
        icon: "warning",
        title: "เลือกครบแล้ว",
        text: `คุณสามารถเลือกได้สูงสุด ${MAX_AREAS} พื้นที่`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setSelectedAreas([...selectedAreas, newArea]);

    // Reset selection
    setSelectedProvinceId("");
    setSelectedAmphureId("");
    setSelectedTambonId("");

    Swal.fire({
      icon: "success",
      title: "เพิ่มพื้นที่สำเร็จ!",
      text: `เพิ่ม ${newArea.displayText} แล้ว`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleRemoveArea = (index: number) => {
    const newAreas = selectedAreas.filter((_, i) => i !== index);
    setSelectedAreas(newAreas);
  };

  const getDisplayText = (
    level: string,
    tambonName?: string,
    amphureName?: string,
    provinceName?: string
  ): string => {
    if (level === "tambon" && tambonName) {
      return `${tambonName}, ${amphureName}, ${provinceName}`;
    }
    if (level === "amphure" && amphureName) {
      return `${amphureName}, ${provinceName}`;
    }
    return provinceName || "";
  };

  // ======== VALIDATION FUNCTIONS ========

  const validateStep1 = (): boolean => {
    // Check display name
    if (!displayName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกชื่อที่แสดง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    if (displayName.trim().length < 2) {
      Swal.fire({
        icon: "error",
        title: "ชื่อสั้นเกินไป",
        text: "ชื่อที่แสดงต้องมีความยาวอย่างน้อย 2 ตัวอักษร",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    if (displayName.trim().length > 50) {
      Swal.fire({
        icon: "error",
        title: "ชื่อยาวเกินไป",
        text: "ชื่อที่แสดงต้องมีความยาวไม่เกิน 50 ตัวอักษร",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Check if name is available
    if (nameCheckResult && !nameCheckResult.available) {
      Swal.fire({
        icon: "error",
        title: "ชื่อไม่สามารถใช้ได้",
        text: nameCheckResult.message,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Check phone
    if (!phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกเบอร์โทรศัพท์",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      Swal.fire({
        icon: "error",
        title: "เบอร์โทรไม่ถูกต้อง",
        text: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (10 หลัก เริ่มต้นด้วย 0)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Check coverage areas
    if (selectedAreas.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกพื้นที่",
        text: "กรุณาเลือกพื้นที่ที่รับงานอย่างน้อย 1 พื้นที่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    // Validate pricing
    if (!noExperience) {
      if (!priceRangeMin || !priceRangeMax) {
        Swal.fire({
          icon: "warning",
          title: "กรุณากรอกช่วงราคา",
          html: "กรุณากรอกช่วงราคาที่เคยรับงาน<br>หรือเลือก <strong>'ไม่เคยรับงานรีวิวมาก่อน'</strong>",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      const min = parseInt(priceRangeMin);
      const max = parseInt(priceRangeMax);

      if (min <= 0 || max <= 0) {
        Swal.fire({
          icon: "error",
          title: "ราคาไม่ถูกต้อง",
          text: "ราคาต้องมากกว่า 0 บาท",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (min > max) {
        Swal.fire({
          icon: "error",
          title: "ราคาไม่ถูกต้อง",
          text: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }

      if (max - min > 50000) {
        Swal.fire({
          icon: "warning",
          title: "ช่วงราคากว้างเกินไป",
          text: "ช่วงราคาควรมีความแตกต่างไม่เกิน 50,000 บาท",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#3b82f6",
        });
        return false;
      }
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!youtube && !facebook && !instagram && !tiktok) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอก Social Media",
        text: "กรุณากรอกลิงก์ Social Media อย่างน้อย 1 ช่องทาง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    const urlRegex = /^https?:\/\/.+/;

    if (youtube && !urlRegex.test(youtube)) {
      Swal.fire({
        icon: "error",
        title: "URL ไม่ถูกต้อง",
        text: "กรุณากรอก URL YouTube ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    if (facebook && !urlRegex.test(facebook)) {
      Swal.fire({
        icon: "error",
        title: "URL ไม่ถูกต้อง",
        text: "กรุณากรอก URL Facebook ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    if (instagram && !urlRegex.test(instagram)) {
      Swal.fire({
        icon: "error",
        title: "URL ไม่ถูกต้อง",
        text: "กรุณากรอก URL Instagram ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    if (tiktok && !urlRegex.test(tiktok)) {
      Swal.fire({
        icon: "error",
        title: "URL ไม่ถูกต้อง",
        text: "กรุณากรอก URL TikTok ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return false;
    }

    return true;
  };

  // ======== NAVIGATION ========

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) {
        return;
      }
      // ถ้ามีชื่อที่คล้ายกัน แสดงคำเตือนก่อนไป step ต่อไป
      if (nameCheckResult?.warning && nameCheckResult.similarNames) {
        const result = await Swal.fire({
          icon: "warning",
          title: "ชื่อใกล้เคียงกับผู้ใช้งานอื่น",
          html: `
            <p>ชื่อ "<strong>${displayName}</strong>" ใกล้เคียงกับ:</p>
            <ul class="text-left mt-2">
              ${nameCheckResult.similarNames
                .slice(0, 3)
                .map(
                  (sim) =>
                    `<li>"${sim.name}" (${sim.similarity}% คล้ายกัน)</li>`
                )
                .join("")}
            </ul>
            <p class="mt-2">คุณยังต้องการใช้ชื่อนี้หรือไม่?</p>
          `,
          showCancelButton: true,
          confirmButtonText: "ใช้ชื่อนี้",
          cancelButtonText: "เปลี่ยนชื่อ",
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) {
          return;
        }
      }
    }

    if (step === 2 && !validateStep2()) {
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // ======== SUBMIT ========

  const handleSubmit = async () => {
    if (!acceptTerms) {
      Swal.fire({
        icon: "warning",
        title: "กรุณายอมรับเงื่อนไข",
        text: "กรุณายอมรับข้อกำหนดและเงื่อนไขก่อนส่งคำขอสมัคร",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาตรวจสอบข้อมูลในแต่ละขั้นตอนให้ครบถ้วน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/creator/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          phone,
          coverageLevel,
          coverageAreas: selectedAreas.map((area) => ({
            provinceId: area.provinceId,
            amphureId: area.amphureId,
            tambonId: area.tambonId,
          })),
          noExperience,
          priceRangeMin: noExperience ? null : parseInt(priceRangeMin),
          priceRangeMax: noExperience ? null : parseInt(priceRangeMax),
          youtube,
          facebook,
          instagram,
          tiktok,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "สมัครสำเร็จ!",
          html: `
            <p>ข้อมูลของคุณได้ถูกส่งไปยังทีมงานเรียบร้อยแล้ว</p>
            <p class="text-sm text-gray-600 mt-2">เราจะตรวจสอบและแจ้งผลกลับภายใน 1-3 วันทำการ</p>
          `,
          confirmButtonText: "ไปที่แดชบอร์ด",
          confirmButtonColor: "#10b981",
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick price selectors
  const pricePresets = [
    { label: "500-1,000", min: 500, max: 1000 },
    { label: "1,000-3,000", min: 1000, max: 3000 },
    { label: "3,000-5,000", min: 3000, max: 5000 },
    { label: "5,000-10,000", min: 5000, max: 10000 },
    { label: "10,000-20,000", min: 10000, max: 20000 },
  ];

  const selectPricePreset = (min: number, max: number) => {
    setPriceRangeMin(min.toString());
    setPriceRangeMax(max.toString());
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            สมัครเป็น Reviewer
          </h1>
          <p className="text-gray-600">
            เริ่มต้นรับงานรีวิวและสร้างรายได้จากความสามารถของคุณ
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 transition-all ${
                      step > s ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
            <span className={step === 1 ? "font-semibold text-blue-600" : ""}>
              ข้อมูลพื้นฐาน
            </span>
            <span
              className={`ml-8 ${
                step === 2 ? "font-semibold text-blue-600" : ""
              }`}
            >
              Social Media
            </span>
            <span
              className={`ml-8 ${
                step === 3 ? "font-semibold text-blue-600" : ""
              }`}
            >
              ตรวจสอบ
            </span>
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

              {/* Display Name with Real-time Check */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อที่แสดง <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="ชื่อที่จะแสดงในโปรไฟล์"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingName && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {!isCheckingName && nameCheckResult && (
                      <>
                        {nameCheckResult.available && !nameCheckResult.warning && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                        {nameCheckResult.available && nameCheckResult.warning && (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                        {!nameCheckResult.available && (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {nameCheckResult && (
                  <div
                    className={`mt-2 p-3 rounded-lg text-sm ${
                      nameCheckResult.available
                        ? nameCheckResult.warning
                          ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                          : "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <p className="font-medium">{nameCheckResult.message}</p>
                    {nameCheckResult.similarNames &&
                      nameCheckResult.similarNames.length > 0 && (
                        <ul className="mt-1 ml-4 list-disc text-xs">
                          {nameCheckResult.similarNames.map((sim, idx) => (
                            <li key={idx}>
                              &quot;{sim.name}&quot; ({sim.similarity}% คล้ายกัน)
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>
                )}

                <p className="mt-1 text-sm text-gray-500">
                  ชื่อนี้จะแสดงให้ร้านค้าเห็นเมื่อเลือกจ้างงาน
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำตัว
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="แนะนำตัวคุณสั้นๆ และประสบการณ์ในการรีวิว..."
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0812345678"
                  required
                />
              </div>

              {/* Coverage Level */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  พื้นที่รับงาน <span className="text-red-500">*</span>
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับพื้นที่
                  </label>
                  <select
                    value={coverageLevel}
                    onChange={(e) => {
                      setCoverageLevel(e.target.value as any);
                      setSelectedAreas([]); // Reset when changing level
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tambon">ระดับตำบล</option>
                    <option value="amphure">ระดับอำเภอ</option>
                    <option value="province">ระดับจังหวัด</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    เลือกได้สูงสุด {MAX_AREAS} พื้นที่
                  </p>
                </div>

                {/* GPS Button */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={handleUseGPS}
                    disabled={isLoadingGPS || selectedAreas.length >= MAX_AREAS}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoadingGPS ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>กำลังหาตำแหน่ง...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-5 h-5" />
                        <span>ใช้ GPS เพิ่มพื้นที่</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GPS Options */}
                {showTambonOptions && gpsLocation?.possibleTambons && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
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
                              ? "cursor-wait opacity-70"
                              : "hover:bg-blue-50 cursor-pointer"
                          }`}
                        >
                          {isSelectingTambon ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm text-gray-600">
                                กำลังเพิ่มพื้นที่...
                              </span>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">
                                {tambon.name_th}
                              </p>
                              <p className="text-sm text-gray-600">
                                {gpsLocation.amphure?.name_th},{" "}
                                {gpsLocation.province?.name_th}
                              </p>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Selection */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    หรือเลือกเอง:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Province */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        จังหวัด
                      </label>
                      <select
                        value={selectedProvinceId}
                        onChange={(e) => {
                          setSelectedProvinceId(e.target.value);
                          setSelectedAmphureId("");
                          setSelectedTambonId("");
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

                    {/* Amphure */}
                    {coverageLevel !== "province" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          อำเภอ
                        </label>
                        <select
                          value={selectedAmphureId}
                          onChange={(e) => {
                            setSelectedAmphureId(e.target.value);
                            setSelectedTambonId("");
                          }}
                          disabled={!selectedProvinceId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                    {coverageLevel === "tambon" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ตำบล
                        </label>
                        <select
                          value={selectedTambonId}
                          onChange={(e) => setSelectedTambonId(e.target.value)}
                          disabled={!selectedAmphureId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                  </div>

                  <button
                    type="button"
                    onClick={handleAddManualArea}
                    disabled={selectedAreas.length >= MAX_AREAS}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    <span>เพิ่มพื้นที่</span>
                  </button>
                </div>

                {/* Selected Areas */}
                {selectedAreas.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="font-medium text-green-900">
                          พื้นที่ที่เลือก ({selectedAreas.length}/{MAX_AREAS})
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedAreas.map((area, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white border border-green-300 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {area.displayText}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArea(index)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Experience */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  ประสบการณ์และราคา
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="noExperience"
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium text-gray-900">
                        ฉันไม่เคยรับงานรีวิวที่ได้รับค่าตอบแทนมาก่อน
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        เหมาะสำหรับผู้ที่เพิ่งเริ่มต้น
                        ทีมงานจะพิจารณาราคาให้ตามความเหมาะสม
                      </p>
                    </label>
                  </div>

                  {!noExperience && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700">
                        ช่วงราคาที่เคยรับงานรีวิว (บาท/งาน){" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          placeholder="ราคาต่ำสุด"
                          min="0"
                          step="100"
                          value={priceRangeMin}
                          onChange={(e) => setPriceRangeMin(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!noExperience}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="number"
                          placeholder="ราคาสูงสุด"
                          min="0"
                          step="100"
                          value={priceRangeMax}
                          onChange={(e) => setPriceRangeMax(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!noExperience}
                        />
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">เลือกด่วน:</p>
                        <div className="flex flex-wrap gap-2">
                          {pricePresets.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                selectPricePreset(preset.min, preset.max)
                              }
                              className="px-3 py-1 text-sm border border-blue-300 rounded-full hover:bg-blue-50 hover:border-blue-500 transition-colors"
                            >
                              {preset.label} บาท
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-gray-700">
                            <p className="font-medium">หมายเหตุ:</p>
                            <ul className="mt-1 space-y-1 list-disc list-inside">
                              <li>
                                ราคาที่แท้จริงจะถูกกำหนดโดยทีมงานตามประสบการณ์และคุณภาพผลงาน
                              </li>
                              <li>
                                ข้อมูลนี้ใช้เพื่อประกอบการพิจารณาเท่านั้น
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Social Media */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Social Media
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">
                      กรุณากรอกข้อมูลอย่างน้อย 1 ช่องทาง{" "}
                      <span className="text-red-500">*</span>
                    </p>
                    <p className="mt-1">
                      ลิงก์ต้องเริ่มต้นด้วย http:// หรือ https://
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    <span>YouTube</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span>Facebook</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Instagram className="w-5 h-5 text-pink-600" />
                    <span>Instagram</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Music className="w-5 h-5 text-gray-900" />
                    <span>TikTok</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://tiktok.com/@youraccount"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Terms */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ตรวจสอบข้อมูล
              </h2>

              <div className="space-y-4">
                {/* Basic Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    ข้อมูลพื้นฐาน
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อที่แสดง:</span>
                      <span className="font-medium">{displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เบอร์โทรศัพท์:</span>
                      <span className="font-medium">{phone}</span>
                    </div>
                    {bio && (
                      <div>
                        <span className="text-gray-600">คำแนะนำตัว:</span>
                        <p className="mt-1 text-gray-900">{bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coverage Areas Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    พื้นที่รับงาน ({selectedAreas.length} พื้นที่)
                  </h3>
                  <div className="space-y-2">
                    {selectedAreas.map((area, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{area.displayText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    ประสบการณ์และราคา
                  </h3>
                  <div className="text-sm">
                    {noExperience ? (
                      <p className="text-gray-600">
                        ไม่เคยรับงานรีวิวที่ได้รับค่าตอบแทนมาก่อน
                      </p>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ช่วงราคา:</span>
                        <span className="font-medium">
                          {parseInt(priceRangeMin).toLocaleString()} -{" "}
                          {parseInt(priceRangeMax).toLocaleString()} บาท
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Social Media
                  </h3>
                  <div className="space-y-2 text-sm">
                    {youtube && (
                      <div className="flex items-center space-x-2">
                        <Youtube className="w-4 h-4 text-red-600" />
                        <a
                          href={youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {youtube}
                        </a>
                      </div>
                    )}
                    {facebook && (
                      <div className="flex items-center space-x-2">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <a
                          href={facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {facebook}
                        </a>
                      </div>
                    )}
                    {instagram && (
                      <div className="flex items-center space-x-2">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <a
                          href={instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {instagram}
                        </a>
                      </div>
                    )}
                    {tiktok && (
                      <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4 text-gray-900" />
                        <a
                          href={tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {tiktok}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="border-t pt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="acceptTerms"
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <span className="font-medium text-gray-900">
                          ฉันยอมรับ
                          <a
                            href="/terms"
                            target="_blank"
                            className="text-blue-600 hover:underline mx-1"
                          >
                            ข้อกำหนดและเงื่อนไข
                          </a>
                          และ
                          <a
                            href="/privacy"
                            target="_blank"
                            className="text-blue-600 hover:underline mx-1"
                          >
                            นโยบายความเป็นส่วนตัว
                          </a>
                          <span className="text-red-500">*</span>
                        </span>
                        <p className="text-gray-600 mt-1">
                          โปรดอ่านและยอมรับเงื่อนไขก่อนส่งคำขอสมัคร
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-2">
                        ขั้นตอนต่อไปหลังจากกดส่งคำขอ:
                      </p>
                      <ol className="space-y-1 list-decimal list-inside">
                        <li>ทีมงานจะตรวจสอบข้อมูลและผลงานของคุณ</li>
                        <li>กำหนดราคาที่เหมาะสมตามคุณภาพและประสบการณ์</li>
                        <li>แจ้งผลการพิจารณาภายใน 1-3 วันทำการ</li>
                        <li>
                          หากได้รับการอนุมัติ
                          คุณจะสามารถเริ่มรับงานได้ทันที
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>ย้อนกลับ</span>
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !acceptTerms}
                className="ml-auto flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>กำลังส่ง...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>ส่งคำขอสมัคร</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            มีคำถาม?{" "}
            <a
              href="/help"
              className="text-blue-600 hover:underline font-medium"
            >
              ติดต่อทีมงาน
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}