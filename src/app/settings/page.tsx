// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Lock,
  Eye,
  Globe,
  Palette,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  LogOut,
} from "lucide-react";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: "public" | "private";
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    language: "th" | "en";
    theme: "light" | "dark" | "auto";
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      language: "th",
      theme: "auto",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "notifications" | "privacy" | "preferences" | "security" | "danger"
  >("notifications");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/settings");
      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt(
      'พิมพ์ "DELETE" เพื่อยืนยันการลบบัญชี (ไม่สามารถกู้คืนได้)'
    );

    if (confirmText !== "DELETE") {
      alert("ยกเลิกการลบบัญชี");
      return;
    }

    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
      });

      if (res.ok) {
        alert("ลบบัญชีเรียบร้อยแล้ว");
        await signOut({ callbackUrl: "/" });
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: "notifications" as const,
      label: "การแจ้งเตือน",
      icon: Bell,
    },
    {
      id: "privacy" as const,
      label: "ความเป็นส่วนตัว",
      icon: Eye,
    },
    {
      id: "preferences" as const,
      label: "การตั้งค่าทั่วไป",
      icon: Palette,
    },
    {
      id: "security" as const,
      label: "ความปลอดภัย",
      icon: Shield,
    },
    {
      id: "danger" as const,
      label: "โซนอันตราย",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การตั้งค่า</h1>
          <p className="text-gray-600">
            จัดการบัญชีและความเป็นส่วนตัวของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Bell size={24} />
                    การแจ้งเตือน
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          แจ้งเตือนทางอีเมล
                        </p>
                        <p className="text-sm text-gray-600">
                          รับการแจ้งเตือนผ่านอีเมลของคุณ
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                email: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          แจ้งเตือนแบบ Push
                        </p>
                        <p className="text-sm text-gray-600">
                          รับการแจ้งเตือนบนอุปกรณ์ของคุณ
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                push: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">แจ้งเตือน SMS</p>
                        <p className="text-sm text-gray-600">
                          รับการแจ้งเตือนผ่าน SMS
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.sms}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                sms: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          การตลาดและโปรโมชั่น
                        </p>
                        <p className="text-sm text-gray-600">
                          รับข่าวสารโปรโมชั่นพิเศษ
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.marketing}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                marketing: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === "privacy" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Eye size={24} />
                    ความเป็นส่วนตัว
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block font-medium text-gray-900 mb-3">
                        การมองเห็นโปรไฟล์
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value="public"
                            checked={
                              settings.privacy.profileVisibility === "public"
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  profileVisibility: e.target.value as
                                    | "public"
                                    | "private",
                                },
                              })
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <p className="font-medium">สาธารณะ</p>
                            <p className="text-sm text-gray-600">
                              ทุกคนสามารถเห็นโปรไฟล์ของคุณได้
                            </p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value="private"
                            checked={
                              settings.privacy.profileVisibility === "private"
                            }
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  profileVisibility: e.target.value as
                                    | "public"
                                    | "private",
                                },
                              })
                            }
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <p className="font-medium">ส่วนตัว</p>
                            <p className="text-sm text-gray-600">
                              เฉพาะคุณเท่านั้นที่มองเห็นโปรไฟล์
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">แสดงอีเมล</p>
                        <p className="text-sm text-gray-600">
                          แสดงอีเมลในโปรไฟล์สาธารณะ
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showEmail}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacy: {
                                ...settings.privacy,
                                showEmail: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          แสดงเบอร์โทรศัพท์
                        </p>
                        <p className="text-sm text-gray-600">
                          แสดงเบอร์โทรในโปรไฟล์สาธารณะ
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy.showPhone}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacy: {
                                ...settings.privacy,
                                showPhone: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === "preferences" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Palette size={24} />
                    การตั้งค่าทั่วไป
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                        <Globe size={20} />
                        ภาษา
                      </label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              language: e.target.value as "th" | "en",
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="th">ไทย</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 font-medium text-gray-900 mb-3">
                        <Palette size={20} />
                        ธีม
                      </label>
                      <select
                        value={settings.preferences.theme}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              theme: e.target.value as "light" | "dark" | "auto",
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">สว่าง</option>
                        <option value="dark">มืด</option>
                        <option value="auto">อัตโนมัติ</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Shield size={24} />
                    ความปลอดภัย
                  </h2>

                  <div className="space-y-4">
                    <button
                      onClick={() => router.push("/settings/change-password")}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Lock size={20} className="text-gray-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            เปลี่ยนรหัสผ่าน
                          </p>
                          <p className="text-sm text-gray-600">
                            อัพเดทรหัสผ่านของคุณ
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400">›</span>
                    </button>

                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut size={20} className="text-gray-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            ออกจากระบบ
                          </p>
                          <p className="text-sm text-gray-600">
                            ออกจากระบบทุกอุปกรณ์
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-400">›</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {activeSection === "danger" && (
                <div>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={24} />
                    โซนอันตราย
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Trash2 size={24} className="text-red-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-900 mb-2">
                          ลบบัญชี
                        </h3>
                        <p className="text-sm text-red-700 mb-4">
                          การลบบัญชีจะลบข้อมูลทั้งหมดของคุณอย่างถาวร
                          รวมถึงบุ๊คมาร์ค รีวิว และการตั้งค่าทั้งหมด
                          <br />
                          <strong>ไม่สามารถกู้คืนได้!</strong>
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                        >
                          ลบบัญชีถาวร
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {activeSection !== "security" && activeSection !== "danger" && (
                <div className="mt-8 pt-6 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    การเปลี่ยนแปลงจะมีผลทันทีหลังบันทึก
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    <Check size={20} />
                    {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}