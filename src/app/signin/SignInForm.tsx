// src/app/signin/SignInForm.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

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
      await signIn(provider, {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          
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
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
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

            {/* TikTok - สไตล์ TikTok จริงๆ */}
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #fe2c55 0%, #fe2c55 30%, #00f2ea 70%, #00f2ea 100%)',
                  padding: '2px',
                  borderRadius: '0.75rem',
                }}
              >
                <button
                  onClick={() => handleSocialSignIn('tiktok')}
                  className="w-full h-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white rounded-xl transition-all duration-200 relative"
                  style={{ margin: '0' }}
                >
                  {/* TikTok Logo with chromatic aberration effect */}
                  <div className="relative w-5 h-5">
                    <svg className="absolute w-5 h-5" viewBox="0 0 24 24" style={{ left: '-1px', top: '0' }}>
                      <path fill="#fe2c55" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <svg className="absolute w-5 h-5" viewBox="0 0 24 24" style={{ left: '1px', top: '0' }}>
                      <path fill="#00f2ea" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <svg className="absolute w-5 h-5" viewBox="0 0 24 24" style={{ left: '0', top: '0' }}>
                      <path fill="#000000" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">
                    เข้าสู่ระบบด้วย TikTok
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
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