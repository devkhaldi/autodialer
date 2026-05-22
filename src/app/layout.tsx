import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { DataInitializer } from "@/components/DataInitializer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "autodialer",
  description: "Production-ready Auto Dialer for outbound sales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans flex h-screen w-screen overflow-hidden p-4 md:p-8`}>
        <DataInitializer />
        {/* Floating App Container */}
        <div className="flex w-full h-full bg-white rounded-[24px] shadow-2xl overflow-hidden border border-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-white">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
