// src/app/signin/page.tsx
import { Suspense } from 'react';
import SignInForm from './SignInForm';

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}

// Loading component ระหว่างโหลด
function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
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
  );
}