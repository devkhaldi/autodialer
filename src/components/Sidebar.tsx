"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Phone, Users, History, Settings, Home, LayoutTemplate, BriefcaseBusiness, Settings2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-[260px] flex-col bg-white border-r border-[#e2e8f0]">
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <div className="flex items-center justify-center p-1.5 rounded-lg bg-[#f3e8ff]">
          <Phone className="h-5 w-5 text-[#7c3aed]" />
        </div>
        <span className="ml-3 text-[19px] font-bold text-[#334155] tracking-tight">autodialer</span>
        <button className="ml-auto text-gray-400 hover:text-gray-600">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto mt-2">
        <nav className="flex-1 space-y-0.5 px-3">
          <Link
            href="/"
            className={cn(
              "group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
              pathname === "/" ? "bg-[#f8fafc] text-[#7c3aed]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            )}
          >
            <Home className="mr-3 h-4 w-4 shrink-0" />
            Dashboard
          </Link>
          <Link
            href="/leads"
            className={cn(
              "group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
              pathname === "/leads" ? "bg-[#f8fafc] text-[#7c3aed]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            )}
          >
            <Users className="mr-3 h-4 w-4 shrink-0" />
            Prospects
          </Link>
          <Link
            href="/dialer"
            className={cn(
              "group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
              pathname === "/dialer" ? "bg-[#f8fafc] text-[#7c3aed]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            )}
          >
            <Phone className="mr-3 h-4 w-4 shrink-0" />
            Workspace
          </Link>

          {/* Section Divider Example like 'Accounts' in the image */}
          <div className="mt-8 mb-2 px-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 flex items-center">
               <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               RECORDS
            </span>
            <button className="text-gray-400 hover:text-gray-600">+</button>
          </div>
          <Link
            href="/history"
            className={cn(
              "group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
              pathname === "/history" ? "bg-[#f8fafc] text-[#7c3aed]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            )}
          >
            <History className="mr-3 h-4 w-4 shrink-0" />
            History Log
          </Link>
          <Link
            href="/settings"
            className={cn(
              "group flex items-center px-3 py-2 text-[14px] font-medium rounded-lg transition-colors",
              pathname === "/settings" ? "bg-[#f8fafc] text-[#7c3aed]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            )}
          >
            <Settings2 className="mr-3 h-4 w-4 shrink-0" />
            Settings
          </Link>
        </nav>
      </div>

      {/* User Profile Card (Matches bottom left of screenshot) */}
      <div className="p-4">
        <div className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
          <div>
            <p className="text-[13px] font-semibold text-[#0f172a]">ED Elkhaldi</p>
            <p className="text-[11px] font-medium text-[#64748b] mt-0.5">Autodialer</p>
          </div>
          <Settings className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
