"use client";

import { DialerWidget } from "@/components/DialerWidget";

export default function DialerPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="p-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Power Dialer</h1>
        <p className="text-sm text-gray-500">Integrated calling session. Lead data and real-time mapping synced.</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <DialerWidget />
      </div>
    </div>
  );
}
