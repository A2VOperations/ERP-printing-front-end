'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function WhatsAppRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : '';
    const destination = params ? `/dashboard/whatsapp?${params}` : '/dashboard/whatsapp';
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function WhatsAppPageRedirect() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#F8FAFC] items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WhatsAppRedirect />
    </Suspense>
  );
}
