// app/shop/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store, MapPin, Phone, Mail, Globe, Upload, X, Check } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/shop/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
});

interface Category {
  id: string;
  name: string;
}

interface Location {
  lat: number;
  lng: number;
}

export default function ShopRegisterPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [error, setError] = useState("");
  const [userInteracted, setUserInteracted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    lineId: "",
    hasPhysicalStore: true,
    showLocationOnMap: false,
  });

  const [location, setLocation] = useState<Location>({
    lat: 13.7563,
    lng: 100.5018,
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedGalleryUrls, setUploadedGalleryUrls] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Check user role only once when authenticated
  useEffect(() => {
    const checkShopStatus = async () => {
      // Only check when we have a valid session
      if (status === "authenticated" && session?.user && !hasCheckedRole) {
        const userRole = (session.user as any)?.role;
        console.log("🔍 Checking user role:", userRole, "hasCheckedRole:", hasCheckedRole);
        setHasCheckedRole(true);
        
        if (userRole === "SHOP") {
          console.log("⚠️ User has SHOP role, checking if shop exists...");
          // Check if shop actually exists in database
          try {
            const response = await fetch('/api/shops/my-shop');
            if (response.ok) {
              const data = await response.json();
              if (data.shop) {
                console.log("✅ Shop exists, redirecting to dashboard");
                router.push("/dashboard/shop");
              } else {
                console.log("⚠️ Shop doesn't exist, allowing registration to continue");
              }
            } else {
              console.log("⚠️ Shop doesn't exist, allowing registration to continue");
            }
          } catch (error) {
            console.log("⚠️ Error checking shop, allowing registration to continue");
          }
        } else {
          console.log("✅ User can register as SHOP, current role:", userRole);
        }
      }
    };
    
    checkShopStatus();
  }, [status, hasCheckedRole, router, session?.user]);

  // Fetch categories
  useEffect(() => {
    if (status === "authenticated" && categories.length === 0) {
      fetchCategories();
    }
  }, [status, categories.length]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryImages((prev) => [...prev, ...files]);
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'featured' | 'gallery') => {
    e.preventDefault();
    e.stopPropagation();
    setUserInteracted(true);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (type === 'featured' && imageFiles[0]) {
      setFeaturedImage(imageFiles[0]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFiles[0]);
    } else if (type === 'gallery' && imageFiles.length > 0) {
      setGalleryImages((prev) => [...prev, ...imageFiles]);
      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Validation for each step
  const validateStep = (step: number, showError: boolean = true): boolean => {
    switch (step) {
      case 1: // ข้อมูลพื้นฐาน
        if (!formData.name || formData.name.trim().length < 3) {
          if (showError) setError("กรุณากรอกชื่อร้านอย่างน้อย 3 ตัวอักษร");
          return false;
        }
        if (!formData.categoryId) {
          if (showError) setError("กรุณาเลือกหมวดหมู่ร้านค้า");
          return false;
        }
        break;
      
      case 2: // ที่อยู่และติดต่อ
        if (!formData.address || formData.address.trim().length < 10) {
          if (showError) setError("กรุณากรอกที่อยู่อย่างน้อย 10 ตัวอักษร");
          return false;
        }
        if (!formData.phone || formData.phone.trim().length < 9) {
          if (showError) setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง");
          return false;
        }
        break;
      
      case 3: // รูปภาพและยืนยัน
        if (!featuredImage && !imagePreview) {
          if (showError) setError("กรุณาอัปโหลดรูปภาพหน้าปกร้านค้า");
          return false;
        }
        break;
    }
    
    if (showError) setError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setError(""); // Clear any previous errors
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setError(""); // Clear any previous errors
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow submission on the last step
    if (currentStep !== 3) {
      console.log("Not on final step, preventing submit");
      return;
    }
    
    // Check if this is a real user interaction (not automated)
    if (!userInteracted) {
      setError("กรุณากรอกข้อมูลและกดปุ่มด้วยตัวเอง");
      return;
    }
    
    // Validate final step before submitting
    if (!validateStep(3)) {
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      // Upload featured image first if exists
      let imageUrl = "";
      if (featuredImage) {
        console.log("Uploading featured image...");
        const uploadFormData = new FormData();
        uploadFormData.append("file", featuredImage);

        // Try simple upload first (no image processing)
        const uploadRes = await fetch("/api/upload/simple-upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
          console.error("Featured image upload error:", errorData);
          throw new Error(errorData.error || "Failed to upload featured image");
        }
        
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        console.log("Featured image uploaded:", imageUrl);
      }

      // Upload gallery images
      const galleryUrls: string[] = [];
      for (const galleryFile of galleryImages) {
        console.log("Uploading gallery image...");
        const uploadFormData = new FormData();
        uploadFormData.append("file", galleryFile);

        const uploadRes = await fetch("/api/upload/simple-upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          galleryUrls.push(uploadData.url);
          console.log("Gallery image uploaded:", uploadData.url);
        } else {
          console.warn("Failed to upload gallery image, skipping...");
        }
      }

      // Create shop
      const shopData = {
        ...formData,
        image: imageUrl,
        galleryImages: galleryUrls,
        lat: location.lat,
        lng: location.lng,
      };

      console.log("Creating shop with data:", shopData);

      const res = await fetch("/api/shops/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopData),
      });

      const data = await res.json().catch(() => ({ error: "Invalid response from server" }));

      if (!res.ok) {
        console.error("Shop registration error:", data);
        throw new Error(data.error || "Failed to register shop");
      }

      console.log("Shop registration successful:", data);

      // Show success and redirecting message
      setIsRedirecting(true);
      setError("");
      
      // Update session to reflect new role
      await update();
      
      // Wait a bit for session to update then redirect
      setTimeout(() => {
        router.push("/dashboard/shop");
      }, 500);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการสมัคร");
      setIsRedirecting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "ข้อมูลพื้นฐาน" },
    { number: 2, title: "ที่อยู่และติดต่อ" },
    { number: 3, title: "รูปภาพและยืนยัน" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ลงทะเบียนร้านค้า
          </h1>
          <p className="text-gray-600">
            เพิ่มร้านค้าของคุณเข้าสู่ระบบ Zablink
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
                        ? "bg-blue-600 text-white"
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
                      currentStep > step.number ? "bg-blue-600" : "bg-gray-200"
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

          <form onSubmit={handleSubmit} onKeyDown={(e) => {
            // Prevent form submission on Enter key unless on the last step
            if (e.key === 'Enter' && currentStep < 3) {
              e.preventDefault();
            }
          }}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อร้านค้า *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setUserInteracted(true);
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    onFocus={() => setUserInteracted(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ร้านอาหารดีเด่น"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทร้านค้า *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกประเภท</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียดร้านค้า
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="บรรยายร้านค้าของคุณ..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasPhysicalStore"
                    checked={formData.hasPhysicalStore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasPhysicalStore: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="hasPhysicalStore" className="text-sm text-gray-700">
                    มีหน้าร้านจริง
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่ *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 ถนนสุขุมวิท แขวง... เขต... กรุงเทพฯ 10110"
                    required
                  ></textarea>
                </div>

                {formData.hasPhysicalStore && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline mr-1" size={16} />
                        ปักหมุดตำแหน่งร้านบนแผนที่
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
                          setFormData({
                            ...formData,
                            showLocationOnMap: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="showLocationOnMap"
                        className="text-sm text-gray-700"
                      >
                        แสดงตำแหน่งบนแผนที่สำหรับลูกค้า
                      </label>
                    </div>
                  </>
                )}

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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="02-123-4567"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline mr-1" size={16} />
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="shop@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="inline mr-1" size={16} />
                      เว็บไซต์
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://yourshop.com"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@yourshop"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Image & Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="inline mr-1" size={16} />
                    รูปภาพหน้าปกร้าน
                  </label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturedImage(null);
                            setImagePreview("");
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label 
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'featured')}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span> หรือลากไฟล์มาวางที่นี่
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG หรือ WEBP (สูงสุด 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="inline mr-1" size={16} />
                    รูปภาพแกลเลอรี่ (เพิ่มได้หลายรูป)
                  </label>
                  
                  {/* Upload Button */}
                  <label 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 mb-4"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'gallery')}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">เลือกรูปภาพเพิ่มเติม</span> หรือลากมาวาง
                      </p>
                      <p className="text-xs text-gray-500">หลายรูปพร้อมกัน</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                    />
                  </label>

                  {/* Gallery Previews */}
                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">สรุปข้อมูล</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อร้าน:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ประเภท:</span>
                      <span className="font-medium">
                        {categories.find((c) => c.id === formData.categoryId)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">มีหน้าร้าน:</span>
                      <span className="font-medium">
                        {formData.hasPhysicalStore ? "ใช่" : "ไม่"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">รูปภาพแกลเลอรี่:</span>
                      <span className="font-medium">{galleryImages.length} รูป</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ย้อนกลับ
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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