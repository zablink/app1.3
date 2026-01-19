// src/app/profile/page.tsx
<<<<<<< HEAD

=======
>>>>>>> dev
"use client";

import { useState, useEffect } from "react";
<<<<<<< HEAD
import Link from "next/link"; // ⭐ เพิ่มบรรทัดนี้

export const dynamic = 'force-dynamic';
=======
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Camera,
  Save,
  X,
  Award,
  Star,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";
>>>>>>> dev

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  province: string | null;
  joinedAt: string;
  role: string;
  stats: {
    bookmarksCount: number;
    reviewsCount: number;
    likesReceived: number;
  };
}

export default function ProfilePage() {
<<<<<<< HEAD
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || 'loading';
  
  const [role, setRole] = useState<Role>("user");
=======
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    address: "",
    province: "",
  });
>>>>>>> dev

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

<<<<<<< HEAD
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          {/* ⭐ เปลี่ยนจาก <a> เป็น <Link> */}
          <Link 
            href="/api/auth/signin" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }
=======
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (res.ok) {
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || "",
          phone: data.profile.phone || "",
          bio: data.profile.bio || "",
          address: data.profile.address || "",
          province: data.profile.province || "",
        });
>>>>>>> dev

        // ถ้ายังไม่มีข้อมูลพื้นฐาน แสดง onboarding
        if (!data.profile.phone && !data.profile.bio) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditing(false);
        setShowOnboarding(false);
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        address: profile.address || "",
        province: profile.province || "",
      });
    }
    setIsEditing(false);
    setShowOnboarding(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  // Onboarding Screen - แสดงเมื่อยังไม่มีข้อมูลโปรไฟล์
  if (showOnboarding && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <Sparkles className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ยินดีต้อนรับ {profile.name}!
              </h1>
              <p className="text-lg text-gray-600">
                มาทำความรู้จักกันให้มากขึ้นกันเถอะ
              </p>
            </div>

            {/* Profile Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <User size={64} className="text-blue-600" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition">
                  <Camera size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Onboarding Form */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกชื่อ-นามสกุล"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="089-XXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เกี่ยวกับคุณ
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="บอกเล่าเกี่ยวกับตัวคุณสักหน่อย..."
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">
                สิ่งที่คุณจะได้รับ:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Star className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-blue-800">
                    บุ๊คมาร์คร้านอาหารที่คุณชอบ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-blue-800">
                    แชร์ประสบการณ์และรีวิวร้านต่างๆ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-blue-800">
                    อัปเกรดเป็นนักรีวิวและสร้างรายได้
                  </span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowOnboarding(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                ข้ามไปก่อน
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.phone || isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึกและเริ่มใช้งาน"}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูลโปรไฟล์</p>
        </div>
      </div>
    );
  }

  // Normal Profile View
  return (
<<<<<<< HEAD
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-2"><strong>ชื่อผู้ใช้:</strong> {session.user?.name}</p>
        <p className="mb-2"><strong>อีเมล:</strong> {session.user?.email}</p>
        <p className="mb-4"><strong>Role ปัจจุบัน:</strong> {role}</p>
        {role === "user" && (
          <button
            onClick={upgradeToShop}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            อัปเกรดเป็น Shop
          </button>
        )}
=======
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <User size={64} className="text-blue-600" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition">
                  <Camera size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="ml-6 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.name}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {profile.role === "USER" ? "ผู้ใช้ทั่วไป" : profile.role}
                    </p>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit3 size={18} />
                      แก้ไขโปรไฟล์
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        <X size={18} />
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <Save size={18} />
                        {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Heart size={20} className="text-red-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {profile.stats.bookmarksCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">บุ๊คมาร์ค</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageSquare size={20} className="text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {profile.stats.reviewsCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">รีวิว</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star size={20} className="text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {profile.stats.likesReceived}
                  </span>
                </div>
                <p className="text-sm text-gray-600">ไลค์ที่ได้รับ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">ข้อมูลส่วนตัว</h2>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={18} />
                ชื่อ-นามสกุล
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              ) : (
                <p className="text-gray-900">{profile.name || "-"}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={18} />
                อีเมล
              </label>
              <p className="text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                ไม่สามารถแก้ไขอีเมลได้
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone size={18} />
                เบอร์โทรศัพท์
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              ) : (
                <p className="text-gray-900">{profile.phone || "-"}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={18} />
                เกี่ยวกับฉัน
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="เขียนอะไรสักหน่อยเกี่ยวกับตัวคุณ..."
                />
              ) : (
                <p className="text-gray-900">{profile.bio || "-"}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} />
                ที่อยู่
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ที่อยู่"
                  />
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="จังหวัด"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-gray-900">{profile.address || "-"}</p>
                  {profile.province && (
                    <p className="text-gray-600 text-sm mt-1">
                      {profile.province}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Joined Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={18} />
                วันที่สมัครสมาชิก
              </label>
              <p className="text-gray-900">
                {new Date(profile.joinedAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award size={24} />
                <h3 className="text-xl font-bold">อัปเกรดบัญชี</h3>
              </div>
              <p className="text-white/90 mb-4">
                สมัครเป็นนักรีวิวและเริ่มสร้างรายได้จากการรีวิวร้านอาหาร
              </p>
              <button
                onClick={() => router.push("/upgrade/reviewer")}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                สมัครเป็นนักรีวิว
              </button>
            </div>
          </div>
        </div>
>>>>>>> dev
      </div>
    </div>
  );
}