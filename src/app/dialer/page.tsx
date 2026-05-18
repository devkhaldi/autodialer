"use client";

import { DialerWidget } from "@/components/DialerWidget";
import { DispositionModal } from "@/components/DispositionModal";

export default function DialerPage() {
  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Power Dialer</h1>
        <p className="text-gray-500">Active calling session. Ensure your microphone is connected and SIP credentials are set in <code className="bg-gray-100 text-sm px-1 rounded">.env</code>.</p>
      </header>
      
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full">
        <DialerWidget />
      </div>

      <DispositionModal />
    </div>
  );
}
