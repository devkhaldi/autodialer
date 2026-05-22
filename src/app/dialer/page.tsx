"use client";

import { DialerWidget } from "@/components/DialerWidget";
import { Phone } from "lucide-react";

export default function DialerPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-[#e2e8f0] bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center text-[15px] font-semibold text-[#0f172a]">
           <Phone className="w-5 h-5 mr-3 text-gray-400" />
           Dialer Workspace
        </div>
        <div className="text-[13px] font-medium text-[#64748b]">
           Integrated calling session with Zadarma auto-dial.
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <DialerWidget />
      </div>
    </div>
  );
}
