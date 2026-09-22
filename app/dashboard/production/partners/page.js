'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductionPartnersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/production');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-500 text-sm">
      <div className="text-center space-y-2">
        <p className="font-semibold text-slate-700">Redirecting to Production Dashboard...</p>
        <p className="text-xs text-slate-400">Printing partners are no longer managed separately.</p>
      </div>
    </div>
  );
}
