// app/shop/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Store } from "lucide-react";
import dynamic from "next/dynamic";
import { ShopGalleryManager } from "@/components/shop/ShopGalleryManager";
import { ShopLinksManager } from "@/components/shop/ShopLinksManager";

const MapPicker = dynamic(() => import("@/components/shop/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
});

interface Category {
  id: string;
  name: string;
}

export default function ShopEditPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const shopId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryIds: [] as string[],
    address: "",
    hasPhysicalStore: true,
    showLocationOnMap: false,
  });

  const [location, setLocation] = useState({
    lat: 13.7563,
    lng: 100.5018,
  });

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    console.log('Status : ' , status);
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && session?.user?.id) {
      fetchShopData();
      fetchCategories();
    }
  }, [status, shopId, session?.user?.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchShopData = async () => {
    // Wait for session to be fully loaded
    if (!session?.user?.id) {
      console.log('Session not ready yet');
      return;
    }

    try {
      setIsLoading(true);

      // Fetch shop data
      const shopRes = await fetch(`/api/shops/${shopId}`);
      if (!shopRes.ok) throw new Error("Shop not found");
      const shop = await shopRes.json();

      // Check ownership
      if (shop.ownerId !== session.user.id && session.user.role !== "ADMIN") {
        console.log('Not owner, redirecting...');
        router.push("/dashboard");
        return;
      }

      setFormData({
        name: shop.name || "",
        description: shop.description || "",
        categoryIds: shop.categories?.map((c: any) => c.categoryId || c.id) || [],
        address: shop.address || "",
        hasPhysicalStore: shop.has_physical_store || true,
        showLocationOnMap: shop.show_location_on_map || false,
      });

      if (shop.lat && shop.lng) {
        setLocation({ lat: shop.lat, lng: shop.lng });
      }

      // Fetch gallery
      const galleryRes = await fetch(`/api/shops/${shopId}/gallery`);
      const galleryData = await galleryRes.json();
      setGalleryImages(galleryData || []);

      // Fetch links
      const linksRes = await fetch(`/api/shops/${shopId}/links`);
      const linksData = await linksRes.json();
      setLinks(linksData || []);
    } catch (error) {
      console.error("Error fetching shop:", error);
      setError("ไม่พบข้อมูลร้าน");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lat: location.lat,
          lng: location.lng,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update shop");
      }

      setSuccess("บันทึกข้อมูลสำเร็จ!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>กลับ</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลร้าน</h1>
              <p className="text-gray-600">{formData.name}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {success}
          </div>
        )}

        {/* Basic Info Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อร้าน *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ร้านค้า * (เลือกได้หลายหมวด)
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-sm">กำลังโหลดหมวดหมู่...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-blue-50 cursor-pointer border border-gray-200 transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categoryIds: [...formData.categoryIds, cat.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categoryIds: formData.categoryIds.filter(
                                  (id) => id !== cat.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.categoryIds.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ เลือกแล้ว {formData.categoryIds.length} หมวด
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียดร้านค้า
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="บรรยายร้านค้าของคุณ..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasPhysicalStore"
                checked={formData.hasPhysicalStore}
                onChange={(e) =>
                  setFormData({ ...formData, hasPhysicalStore: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasPhysicalStore" className="text-sm text-gray-700">
                มีหน้าร้านจริง
              </label>
            </div>

            {formData.hasPhysicalStore && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตำแหน่งบนแผนที่
                  </label>
                  <MapPicker
                    initialPosition={location}
                    onLocationChange={setLocation}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showLocationOnMap"
                    checked={formData.showLocationOnMap}
                    onChange={(e) =>
                      setFormData({ ...formData, showLocationOnMap: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showLocationOnMap" className="text-sm text-gray-700">
                    แสดงตำแหน่งบนแผนที่สำหรับลูกค้า
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              <span>{isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</span>
            </button>
          </form>
        </div>

        {/* Gallery Manager */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <ShopGalleryManager
            shopId={shopId}
            initialImages={galleryImages}
            onUpdate={fetchShopData}
          />
        </div>

        {/* Links Manager */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ShopLinksManager
            shopId={shopId}
            initialLinks={links}
            onUpdate={fetchShopData}
          />
        </div>
      </div>
    </div>
  );
}