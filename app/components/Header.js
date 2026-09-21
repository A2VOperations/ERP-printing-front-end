'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Bell, Sparkles } from 'lucide-react';

export default function Header({ title, subtitle, actionButton }) {
  const [tenantName, setTenantName] = useState('A2V Printing Solutions');

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenantName');
    if (storedTenant) setTenantName(storedTenant);
  }, []);


  return (
    <header className="h-16 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Tenant Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>{tenantName}</span>
        </div>

        {/* Action Button if provided */}
        {actionButton}
      </div>
    </header>
  );
}
