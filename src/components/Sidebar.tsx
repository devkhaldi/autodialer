"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Phone, Users, History, Settings, Home } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Dialer", href: "/dialer", icon: Phone },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Phone className="h-4 w-4 text-white" />
        </div>
        <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">autodialer</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto mt-4">
        <nav className="flex-1 space-y-0.5 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                    "mr-3 h-5 w-5 shrink-0 transition-colors"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            ED
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">ELKHALDI</p>
            <p className="text-xs font-medium text-gray-400">Sales Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
