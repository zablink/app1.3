// lib/sweetalert.ts
// Custom SweetAlert2 utility functions สำหรับโปรเจค Zablink

import Swal from "sweetalert2";

/**
 * แสดง Alert แบบ Warning
 */
export const showWarning = (title: string, text: string) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#3b82f6",
  });
};

/**
 * แสดง Alert แบบ Error
 */
export const showError = (title: string, text: string) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "ตกลง",
    confirmButtonColor: "#ef4444",
  });
};

/**
 * แสดง Alert แบบ Success
 */
export const showSuccess = (
  title: string,
  text: string,
  confirmButtonText: string = "ตกลง"
) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText,
    confirmButtonColor: "#10b981",
  });
};

/**
 * แสดง Alert แบบ Success พร้อม HTML content
 */
export const showSuccessHTML = (
  title: string,
  html: string,
  confirmButtonText: string = "ตกลง"
) => {
  return Swal.fire({
    icon: "success",
    title,
    html,
    confirmButtonText,
    confirmButtonColor: "#10b981",
  });
};

/**
 * แสดง Alert แบบ Info
 */
export const showInfo = (title: string, text: string) => {
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "เข้าใจแล้ว",
    confirmButtonColor: "#3b82f6",
  });
};

/**
 * แสดง Confirmation Dialog
 */
export const showConfirm = (
  title: string,
  text: string,
  confirmButtonText: string = "ยืนยัน",
  cancelButtonText: string = "ยกเลิก"
) => {
  return Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6b7280",
  });
};

/**
 * แสดง Confirmation Dialog แบบอันตราย (Delete, Remove, etc.)
 */
export const showDangerConfirm = (
  title: string,
  text: string,
  confirmButtonText: string = "ลบ",
  cancelButtonText: string = "ยกเลิก"
) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    reverseButtons: true, // ปุ่ม cancel อยู่ซ้าย, confirm อยู่ขวา
  });
};

/**
 * แสดง Loading Dialog
 */
export const showLoading = (title: string = "กำลังโหลด...") => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * ปิด Loading Dialog
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * แสดง Toast Notification (แบบมุมจอ)
 */
export const showToast = (
  icon: "success" | "error" | "warning" | "info",
  title: string
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon,
    title,
  });
};

/**
 * Validation Alerts - สำหรับ Form Validation
 */
export const ValidationAlerts = {
  // ข้อมูลไม่ครบ
  missingField: (fieldName: string) => {
    return showWarning("กรุณากรอกข้อมูล", `กรุณากรอก${fieldName}`);
  },

  // ข้อมูลไม่ถูกต้อง
  invalidFormat: (fieldName: string, hint: string) => {
    return showError(`${fieldName}ไม่ถูกต้อง`, hint);
  },

  // เบอร์โทรไม่ถูกต้อง
  invalidPhone: () => {
    return showError(
      "เบอร์โทรไม่ถูกต้อง",
      "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (10 หลัก เริ่มต้นด้วย 0)"
    );
  },

  // URL ไม่ถูกต้อง
  invalidURL: (platform: string) => {
    return showError(
      "URL ไม่ถูกต้อง",
      `กรุณากรอก URL ${platform} ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)`
    );
  },

  // ช่วงราคาไม่ถูกต้อง
  invalidPriceRange: () => {
    return showError(
      "ราคาไม่ถูกต้อง",
      "ราคาต่ำสุดต้องน้อยกว่าหรือเท่ากับราคาสูงสุด"
    );
  },

  // ช่วงราคากว้างเกินไป
  priceRangeTooWide: (maxDiff: number) => {
    return showWarning(
      "ช่วงราคากว้างเกินไป",
      `ช่วงราคาควรมีความแตกต่างไม่เกิน ${maxDiff.toLocaleString()} บาท`
    );
  },

  // ต้องเลือกอย่างน้อย 1 รายการ
  mustSelectOne: (itemName: string) => {
    return showWarning(
      `กรุณาเลือก${itemName}`,
      `กรุณาเลือก${itemName}อย่างน้อย 1 รายการ`
    );
  },
};

/**
 * Success Messages - สำหรับแสดงความสำเร็จ
 */
export const SuccessMessages = {
  // ลงทะเบียนสำเร็จ
  registered: () => {
    return showSuccessHTML(
      "สมัครสำเร็จ!",
      `
        <p>ข้อมูลของคุณได้ถูกส่งไปยังทีมงานเรียบร้อยแล้ว</p>
        <p class="text-sm text-gray-600 mt-2">เราจะตรวจสอบและแจ้งผลกลับภายใน 1-3 วันทำการ</p>
      `,
      "ไปที่แดชบอร์ด"
    );
  },

  // บันทึกข้อมูลสำเร็จ
  saved: () => {
    return showSuccess("บันทึกสำเร็จ!", "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว");
  },

  // อัปเดตข้อมูลสำเร็จ
  updated: () => {
    return showSuccess(
      "อัปเดตสำเร็จ!",
      "ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว"
    );
  },

  // ลบข้อมูลสำเร็จ
  deleted: () => {
    return showSuccess("ลบสำเร็จ!", "ข้อมูลถูกลบเรียบร้อยแล้ว");
  },

  // ส่งข้อมูลสำเร็จ
  submitted: () => {
    return showSuccess("ส่งสำเร็จ!", "ข้อมูลของคุณถูกส่งเรียบร้อยแล้ว");
  },
};

/**
 * Error Messages - สำหรับแสดงข้อผิดพลาด
 */
export const ErrorMessages = {
  // เกิดข้อผิดพลาดทั่วไป
  general: (message?: string) => {
    return showError(
      "เกิดข้อผิดพลาด",
      message || "กรุณาลองใหม่อีกครั้ง"
    );
  },

  // ไม่พบข้อมูล
  notFound: (itemName: string) => {
    return showError("ไม่พบข้อมูล", `ไม่พบ${itemName}ที่คุณต้องการ`);
  },

  // ไม่มีสิทธิ์เข้าถึง
  unauthorized: () => {
    return showError(
      "ไม่มีสิทธิ์เข้าถึง",
      "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้"
    );
  },

  // Session หมดอายุ
  sessionExpired: () => {
    return showError(
      "Session หมดอายุ",
      "กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    );
  },

  // Network error
  networkError: () => {
    return showError(
      "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ"
    );
  },
};

/**
 * Confirmation Messages - สำหรับขอยืนยัน
 */
export const ConfirmMessages = {
  // ยืนยันการลบ
  delete: (itemName: string) => {
    return showDangerConfirm(
      "ยืนยันการลบ",
      `คุณแน่ใจหรือไม่ว่าต้องการลบ${itemName}นี้?`,
      "ลบ",
      "ยกเลิก"
    );
  },

  // ยืนยันการบันทึก
  save: () => {
    return showConfirm(
      "ยืนยันการบันทึก",
      "คุณแน่ใจหรือไม่ว่าต้องการบันทึกข้อมูล?",
      "บันทึก",
      "ยกเลิก"
    );
  },

  // ยืนยันการส่ง
  submit: () => {
    return showConfirm(
      "ยืนยันการส่ง",
      "คุณแน่ใจหรือไม่ว่าต้องการส่งข้อมูล?",
      "ส่ง",
      "ยกเลิก"
    );
  },

  // ยืนยันการยกเลิก
  cancel: () => {
    return showConfirm(
      "ยืนยันการยกเลิก",
      "คุณแน่ใจหรือไม่ว่าต้องการยกเลิก?",
      "ยกเลิก",
      "กลับไป"
    );
  },
};

/**
 * Toast Notifications - สำหรับแจ้งเตือนแบบเบา
 */
export const ToastMessages = {
  success: (message: string) => showToast("success", message),
  error: (message: string) => showToast("error", message),
  warning: (message: string) => showToast("warning", message),
  info: (message: string) => showToast("info", message),
};