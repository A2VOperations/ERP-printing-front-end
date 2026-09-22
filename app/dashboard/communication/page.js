'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunicationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-500 text-sm">
      <div className="text-center space-y-2">
        <p className="font-semibold text-slate-700">Redirecting to Dashboard...</p>
        <p className="text-xs text-slate-400">Communication features are no longer active.</p>
      </div>
    </div>
  );
}
