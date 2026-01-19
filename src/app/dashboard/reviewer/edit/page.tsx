// app/dashboard/reviewer/edit/page.tsx
// หน้าแก้ไข Reviewer Profile (เฉพาะผู้ที่ APPROVED แล้ว)

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

export default function EditReviewerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [coverageLevel, setCoverageLevel] = useState("tambon");
  const [provinceId, setProvinceId] = useState("");
  const [amphureId, setAmphureId] = useState("");
  const [tambonId, setTambonId] = useState("");

  // Pricing
  const [noExperience, setNoExperience] = useState(false);
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");

  // Social Media
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  // Portfolio
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([""]);

  // Current pricing set by admin (read-only display)
  const [currentPriceMin, setCurrentPriceMin] = useState<number | null>(null);
  const [currentPriceMax, setCurrentPriceMax] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/creator/profile");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลได้");
      }

      const creator = data.data;

      // Check if approved
      if (creator.applicationStatus !== "APPROVED") {
        setMessage({
          type: "error",
          text: "คุณต้องได้รับการอนุมัติก่อนจึงจะแก้ไขข้อมูลได้",
        });
        setTimeout(() => router.push("/dashboard"), 3000);
        return;
      }

      // Populate form
      setDisplayName(creator.displayName || "");
      setBio(creator.bio || "");
      setPhone(creator.phone || "");
      setCoverageLevel(creator.coverageLevel || "tambon");
      setProvinceId(creator.provinceId?.toString() || "");
      setAmphureId(creator.amphureId?.toString() || "");
      setTambonId(creator.tambonId?.toString() || "");

      // Pricing
      setNoExperience(!creator.hasExperience);
      setPriceRangeMin(creator.priceRangeMin?.toString() || "");
      setPriceRangeMax(creator.priceRangeMax?.toString() || "");
      setCurrentPriceMin(creator.currentPriceMin);
      setCurrentPriceMax(creator.currentPriceMax);

      // Social Media
      const social = creator.socialMedia || {};
      setYoutube(social.youtube || "");
      setFacebook(social.facebook || "");
      setInstagram(social.instagram || "");
      setTiktok(social.tiktok || "");

      // Portfolio
      setPortfolioLinks(
        creator.portfolioLinks?.length > 0 ? creator.portfolioLinks : [""]
      );

      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!displayName || !phone || !coverageLevel) {
      setMessage({
        type: "error",
        text: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    if (!noExperience) {
      if (!priceRangeMin || !priceRangeMax) {
        setMessage({
          type: "error",
          text: "กรุณากรอกช่วงราคาที่เคยรับงาน",
        });
        return;
      }

      const min = parseInt(priceRangeMin);
      const max = parseInt(priceRangeMax);

      if (min < 0 || max < 0) {
        setMessage({
          type: "error",
          text: "ราคาต้องมากกว่าหรือเท่ากับ 0",
        });
        return;
      }

      if (min > max) {
        setMessage({
          type: "error",
          text: "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด",
        });
        return;
      }
    }

    if (!youtube && !facebook && !instagram && !tiktok) {
      setMessage({
        type: "error",
        text: "กรุณาระบุ Social Media อย่างน้อย 1 ช่องทาง",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/creator/profile", {
        method: "PUT",
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

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: "บันทึกข้อมูลเรียบร้อยแล้ว!",
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            แก้ไขโปรไฟล์ Reviewer
          </h1>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="text-green-600 mt-0.5" size={20} />
              ) : (
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
              )}
              <p
                className={
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Current Pricing Display (Read-only) */}
          {currentPriceMin && currentPriceMax && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                💰 ราคาปัจจุบันของคุณ
              </h3>
              <p className="text-blue-800">
                <span className="text-2xl font-bold">
                  ฿{currentPriceMin.toLocaleString()} - ฿
                  {currentPriceMax.toLocaleString()}
                </span>
                <span className="text-sm ml-2">(กำหนดโดยทีมงาน)</span>
              </p>
              <p className="text-sm text-blue-700 mt-2">
                ราคานี้จะแสดงให้ร้านค้าเห็นเมื่อเลือก Reviewer
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
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
                  required
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
                  required
                />
              </div>
            </div>

            {/* Pricing Experience */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                ประสบการณ์และราคา
              </h2>

              <div className="space-y-4">
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
                  <label htmlFor="noExperience" className="flex-1 cursor-pointer">
                    <span className="font-medium">
                      ฉันไม่เคยรับงานรีวิวที่ได้รับค่าตอบแทนมาก่อน
                    </span>
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
                        className="flex-1 px-4 py-2 border rounded-lg"
                      />
                      <span className="text-gray-500">ถึง</span>
                      <input
                        type="number"
                        placeholder="ราคาสูงสุด"
                        min="0"
                        step="100"
                        value={priceRangeMax}
                        onChange={(e) => setPriceRangeMax(e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-lg"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600">
                        ช่วงราคาที่ผู้ใช้นิยม:
                      </span>
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
                          className="px-3 py-1 text-sm border rounded-full hover:bg-blue-50 hover:border-blue-500"
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Social Media
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={20} />
                <span>{saving ? "กำลังบันทึก..." : "บันทึก"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}