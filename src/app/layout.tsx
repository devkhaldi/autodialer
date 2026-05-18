import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { useEffect } from "react";
import { useLeadStore } from "@/store/leadStore";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "autodialer",
  description: "Production-ready WebRTC Auto Dialer for outbound sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { fetchLeads } = useLeadStore();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-gray-50 text-gray-900 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
