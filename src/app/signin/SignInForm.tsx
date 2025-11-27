// src/app/signin/SignInForm.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function SignInFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  // Log all URL parameters for debugging
  useEffect(() => {
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    
    if (Object.keys(allParams).length > 0) {
      console.log('📋 URL Parameters:', allParams);
    }
    
    if (error) {
      console.error('❌ NextAuth Error Code:', error);
    }
  }, [searchParams, error]);

  // แปลง error code เป็นข้อความภาษาไทย
  const getErrorMessage = (error: string | null): string | null => {
    if (!error) return null;

    const errorMessages: Record<string, string> = {
      OAuthSignin: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับบัญชี กรุณาลองใหม่อีกครั้ง',
      OAuthCallback: 'ไม่สามารถยืนยันตัวตนได้ กรุณาตรวจสอบการตั้งค่าบัญชีและลองใหม่อีกครั้ง',
      OAuthCreateAccount: 'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง',
      EmailCreateAccount: 'ไม่สามารถสร้างบัญชีด้วยอีเมลนี้ได้',
      Callback: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่',
      OAuthAccountNotLinked: 'อีเมลนี้ถูกใช้กับวิธีเข้าสู่ระบบอื่นอยู่แล้ว กรุณาใช้วิธีเดิม',
      EmailSignin: 'ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่',
      CredentialsSignin: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      SessionRequired: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
      google: 'การเชื่อมต่อกับ Google ล้มเหลว กรุณาตรวจสอบการตั้งค่า OAuth หรือลองใหม่อีกครั้ง',
      facebook: 'การเชื่อมต่อกับ Facebook ล้มเหลว กรุณาลองใหม่อีกครั้ง',
      Default: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'
    };

    return errorMessages[error] || errorMessages.Default;
  };

  const errorMessage = getErrorMessage(error);

  // ลบ error จาก URL หลังจากแสดงผล 5 วินาที
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        router.replace(url.pathname + url.search);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, router]);

  const handleSocialSignIn = async (provider: string) => {
    try {
      // Clear any stale NextAuth cookies before signing in
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.trim().split("=")[0];
        if (cookieName.includes('next-auth')) {
          document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
        }
      });
      
      // Direct redirect to OAuth provider
      const params = new URLSearchParams({
        callbackUrl: callbackUrl,
      });
      
      const signInUrl = `/api/auth/signin/${provider}?${params.toString()}`;
      
      // Log for debugging
      console.log('🔗 Redirecting to:', signInUrl);
      console.log('🌐 Full URL:', window.location.origin + signInUrl);
      
      window.location.href = signInUrl;
    } catch (error) {
      console.error('Sign in error:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ\n\nกรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card Container with gradient and rich line pattern */}
        <div className="relative bg-gradient-to-b from-white to-blue-200 rounded-2xl shadow-xl p-8 overflow-hidden">
          
          {/* Rich vertical lines pattern - 70 lines total (50 blue + 20 white) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ mixBlendMode: 'multiply' }}
          >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
              {/* Blue lines - ชุดที่ 1: มุมเอียงน้อย */}
              <line x1="3%" y1="0" x2="5%" y2="100%" stroke="#1e40af" strokeWidth="0.7" opacity="0.11" />
              <line x1="6%" y1="0" x2="9%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.17" />
              <line x1="8%" y1="0" x2="6%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.14" />
              <line x1="11%" y1="0" x2="14%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.20" />
              <line x1="13%" y1="0" x2="11%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.12" />
              
              {/* Blue lines - ชุดที่ 2: มุมเอียงปานกลาง */}
              <line x1="16%" y1="0" x2="20%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.18" />
              <line x1="19%" y1="0" x2="15%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.15" />
              <line x1="22%" y1="0" x2="26%" y2="100%" stroke="#1e40af" strokeWidth="1.4" opacity="0.21" />
              <line x1="25%" y1="0" x2="21%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.13" />
              <line x1="28%" y1="0" x2="32%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.19" />
              
              {/* White lines - ชุดที่ 1: สร้างความตัดกัน */}
              <line x1="10%" y1="0" x2="12%" y2="100%" stroke="#ffffff" strokeWidth="1.5" opacity="0.65" />
              <line x1="17%" y1="0" x2="19%" y2="100%" stroke="#ffffff" strokeWidth="1.2" opacity="0.50" />
              <line x1="24%" y1="0" x2="22%" y2="100%" stroke="#ffffff" strokeWidth="1.4" opacity="0.42" />
              
              {/* Blue lines - ชุดที่ 3: มุมเอียงมาก */}
              <line x1="30%" y1="0" x2="38%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.22" />
              <line x1="33%" y1="0" x2="27%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.16" />
              <line x1="36%" y1="0" x2="42%" y2="100%" stroke="#1e40af" strokeWidth="1.5" opacity="0.23" />
              <line x1="40%" y1="0" x2="34%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.14" />
              <line x1="43%" y1="0" x2="47%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.19" />
              
              {/* White lines - ชุดที่ 2 */}
              <line x1="31%" y1="0" x2="35%" y2="100%" stroke="#ffffff" strokeWidth="1.6" opacity="0.68" />
              <line x1="38%" y1="0" x2="36%" y2="100%" stroke="#ffffff" strokeWidth="1.3" opacity="0.73" />
              <line x1="44%" y1="0" x2="46%" y2="100%" stroke="#ffffff" strokeWidth="1.1" opacity="0.58" />
              
              {/* Blue lines - ชุดที่ 4: กลาง */}
              <line x1="46%" y1="0" x2="48%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.12" />
              <line x1="49%" y1="0" x2="53%" y2="100%" stroke="#1e40af" strokeWidth="1.4" opacity="0.20" />
              <line x1="51%" y1="0" x2="49%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.15" />
              <line x1="54%" y1="0" x2="58%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.18" />
              <line x1="56%" y1="0" x2="52%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.13" />
              
              {/* White lines - ชุดที่ 3: ตรงกลาง */}
              <line x1="50%" y1="0" x2="51%" y2="100%" stroke="#ffffff" strokeWidth="1.7" opacity="0.80" />
              <line x1="55%" y1="0" x2="57%" y2="100%" stroke="#ffffff" strokeWidth="1.2" opacity="0.61" />
              
              {/* Blue lines - ชุดที่ 5: มุมเอียงมากพิเศษ */}
              <line x1="59%" y1="0" x2="66%" y2="100%" stroke="#1e40af" strokeWidth="1.5" opacity="0.22" />
              <line x1="62%" y1="0" x2="56%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.17" />
              <line x1="65%" y1="0" x2="71%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.21" />
              <line x1="68%" y1="0" x2="62%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.14" />
              <line x1="70%" y1="0" x2="74%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.19" />
              
              {/* White lines - ชุดที่ 4 */}
              <line x1="60%" y1="0" x2="64%" y2="100%" stroke="#ffffff" strokeWidth="1.4" opacity="0.64" />
              <line x1="67%" y1="0" x2="65%" y2="100%" stroke="#ffffff" strokeWidth="1.5" opacity="0.76" />
              <line x1="72%" y1="0" x2="75%" y2="100%" stroke="#ffffff" strokeWidth="1.1" opacity="0.49" />
              
              {/* Blue lines - ชุดที่ 6: มุมเอียงปานกลาง */}
              <line x1="73%" y1="0" x2="77%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.16" />
              <line x1="76%" y1="0" x2="72%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.20" />
              <line x1="79%" y1="0" x2="83%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.18" />
              <line x1="81%" y1="0" x2="77%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.13" />
              <line x1="84%" y1="0" x2="88%" y2="100%" stroke="#1e40af" strokeWidth="1.4" opacity="0.21" />
              
              {/* White lines - ชุดที่ 5 */}
              <line x1="74%" y1="0" x2="78%" y2="100%" stroke="#ffffff" strokeWidth="1.6" opacity="0.67" />
              <line x1="80%" y1="0" x2="82%" y2="100%" stroke="#ffffff" strokeWidth="1.2" opacity="0.62" />
              <line x1="85%" y1="0" x2="87%" y2="100%" stroke="#ffffff" strokeWidth="1.3" opacity="0.63" />
              
              {/* Blue lines - ชุดที่ 7: ท้ายสุด */}
              <line x1="86%" y1="0" x2="84%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.14" />
              <line x1="89%" y1="0" x2="92%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.19" />
              <line x1="91%" y1="0" x2="89%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.15" />
              <line x1="94%" y1="0" x2="97%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.20" />
              <line x1="96%" y1="0" x2="93%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.17" />
              
              {/* White lines - ชุดที่ 6: ท้ายสุด */}
              <line x1="88%" y1="0" x2="90%" y2="100%" stroke="#ffffff" strokeWidth="1.4" opacity="0.45" />
              <line x1="92%" y1="0" x2="94%" y2="100%" stroke="#ffffff" strokeWidth="1.5" opacity="0.48" />
              <line x1="95%" y1="0" x2="96%" y2="100%" stroke="#ffffff" strokeWidth="1.2" opacity="0.50" />
              
              {/* เส้นเพิ่มเติมระหว่างช่องว่าง - Blue */}
              <line x1="4%" y1="0" x2="7%" y2="100%" stroke="#1e40af" strokeWidth="0.7" opacity="0.10" />
              <line x1="12%" y1="0" x2="10%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.11" />
              <line x1="20%" y1="0" x2="23%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.14" />
              <line x1="27%" y1="0" x2="24%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.12" />
              <line x1="35%" y1="0" x2="39%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.16" />
              <line x1="41%" y1="0" x2="37%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.18" />
              <line x1="48%" y1="0" x2="52%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.13" />
              <line x1="57%" y1="0" x2="54%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.15" />
              <line x1="63%" y1="0" x2="67%" y2="100%" stroke="#1e40af" strokeWidth="1.3" opacity="0.19" />
              <line x1="69%" y1="0" x2="64%" y2="100%" stroke="#1e40af" strokeWidth="0.9" opacity="0.14" />
              <line x1="75%" y1="0" x2="79%" y2="100%" stroke="#1e40af" strokeWidth="1.1" opacity="0.17" />
              <line x1="82%" y1="0" x2="78%" y2="100%" stroke="#1e40af" strokeWidth="1.2" opacity="0.18" />
              <line x1="87%" y1="0" x2="90%" y2="100%" stroke="#1e40af" strokeWidth="0.8" opacity="0.12" />
              <line x1="93%" y1="0" x2="91%" y2="100%" stroke="#1e40af" strokeWidth="1.0" opacity="0.16" />
              
              {/* เส้นเพิ่มเติมระหว่างช่องว่าง - White */}
              <line x1="15%" y1="0" x2="13%" y2="100%" stroke="#ffffff" strokeWidth="1.1" opacity="0.49" />
              <line x1="29%" y1="0" x2="31%" y2="100%" stroke="#ffffff" strokeWidth="1.3" opacity="0.51" />
              <line x1="45%" y1="0" x2="47%" y2="100%" stroke="#ffffff" strokeWidth="1.2" opacity="0.50" />
              <line x1="58%" y1="0" x2="61%" y2="100%" stroke="#ffffff" strokeWidth="1.4" opacity="0.54" />
              <line x1="71%" y1="0" x2="69%" y2="100%" stroke="#ffffff" strokeWidth="1.1" opacity="0.68" />
              <line x1="83%" y1="0" x2="86%" y2="100%" stroke="#ffffff" strokeWidth="1.5" opacity="0.66" />
            </svg>
          </div>

          {/* Content - positioned above pattern */}
          <div className="relative z-10 space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                {/* Logo */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">Z</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                ยินดีต้อนรับสู่ Zablink
              </h1>
              <p className="text-gray-600">
                เลือกวิธีที่คุณต้องการเข้าสู่ระบบ
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-shake">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg 
                      className="h-5 w-5 text-red-400" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('error');
                      router.replace(url.pathname + url.search);
                    }}
                    className="flex-shrink-0 ml-3"
                  >
                    <svg 
                      className="h-4 w-4 text-red-400 hover:text-red-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3">
              
              {/* Google */}
              <button
                onClick={() => handleSocialSignIn('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium group-hover:text-gray-900">
                  เข้าสู่ระบบด้วย Google
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleSocialSignIn('facebook')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">
                  เข้าสู่ระบบด้วย Facebook
                </span>
              </button>

              {/* LINE */}
              <button
                onClick={() => handleSocialSignIn('line')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#00B900] text-white rounded-xl hover:bg-[#00A000] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span className="font-medium">
                  เข้าสู่ระบบด้วย LINE
                </span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={() => handleSocialSignIn('twitter')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-medium">
                  เข้าสู่ระบบด้วย X
                </span>
              </button>

              {/* TikTok */}
              <button
                onClick={() => handleSocialSignIn('tiktok')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group shadow-sm"
              >
                {/* TikTok Logo with gradient border */}
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #fe2c55 0%, #fe2c55 50%, #00f2ea 50%, #00f2ea 100%)',
                      padding: '2px',
                    }}
                  >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="black">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <span className="text-gray-700 font-medium group-hover:text-gray-900">
                  เข้าสู่ระบบด้วย TikTok
                </span>
              </button>

            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-500">
                  หรือ
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                คุณยังไม่มีบัญชี?{' '}
                <button 
                  onClick={() => handleSocialSignIn('google')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  สมัครสมาชิก
                </button>
              </p>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500 pt-4">
              การเข้าสู่ระบบแสดงว่าคุณยอมรับ{' '}
              <Link 
                href="/terms" 
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                ข้อกำหนดการใช้งาน
              </Link>
              {' และ '}
              <Link 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>

        {/* Help Link */}
        <div className="mt-6 text-center">
          <Link 
            href="/help" 
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ต้องการความช่วยเหลือ?
          </Link>
        </div>
      </div>

      {/* Add shake animation for error */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Export with Suspense wrapper
export default function SignInForm() {
  return (
    <Suspense fallback={<SignInFormLoading />}>
      <SignInFormContent />
    </Suspense>
  );
}

// Loading component
function SignInFormLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="relative bg-gradient-to-b from-white to-blue-200 rounded-2xl shadow-xl p-8">
          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center animate-pulse">
                  <span className="text-2xl font-bold text-white">Z</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                กำลังโหลด...
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}