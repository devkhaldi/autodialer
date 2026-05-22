"use client";

import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore } from '@/store/leadStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { triggerZadarmaCall } from '@/lib/zadarmaService';
import { useState } from 'react';
import { Zap, Phone, Settings2, Trash2, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const { delaySeconds, setDelaySeconds, autoCall, setAutoCall, callerNumber, setCallerNumber } = useDialerStore();
  const { clearLeads } = useLeadStore();
  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all leads? This cannot be undone.")) {
      clearLeads();
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-[#e2e8f0] bg-white sticky top-0 z-10">
        <div className="flex items-center text-[15px] font-semibold text-[#0f172a]">
           <Settings2 className="w-5 h-5 mr-3 text-gray-400" />
           Configuration & Settings
        </div>
      </header>

      <div className="flex-1 p-8 md:p-10 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-[#f0f9ff]/50 border border-[#e0f2fe] rounded-[16px] p-6">
            <h3 className="text-[15px] font-semibold text-[#0f172a] mb-5 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-[#7c3aed]" />
              Zadarma Integration
            </h3>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
                  <div>
                    <label className="text-[14px] font-semibold text-[#0f172a]">Auto-Call via Zadarma</label>
                    <p className="text-[13px] text-[#64748b] mt-0.5">Automatically trigger calls when a new lead loads in the workspace</p>
                  </div>
                  <Switch checked={autoCall} onCheckedChange={setAutoCall} />
                </div>

                <div className="pb-4 border-b border-[#e2e8f0]">
                  <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
                    Zadarma SIP ID (From .env file)
                  </label>
                  <Input
                    value={process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || callerNumber}
                    readOnly
                    className="max-w-md bg-gray-50 border-[#cbd5e1] text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[12px] text-[#64748b] mt-1.5 font-medium">
                    This SIP ID is populated securely from your local environment file.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] p-6">
            <h3 className="text-[15px] font-semibold text-[#0f172a] mb-5 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              Dialer Workflow
            </h3>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">Delay Between Calls</label>
                  <select 
                    className="w-full bg-white border border-[#cbd5e1] text-[14px] rounded-lg px-3 py-2 text-[#0f172a] shadow-sm focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] outline-none max-w-md transition-colors"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  >
                    <option value={0}>No Delay</option>
                    <option value={5}>5 Seconds</option>
                    <option value={10}>10 Seconds (Recommended)</option>
                    <option value={15}>15 Seconds</option>
                    <option value={30}>30 Seconds</option>
                  </select>
                  <p className="text-[12px] text-[#64748b] mt-1.5 font-medium">Wait time before the next call auto-starts.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-[16px] p-6">
            <h3 className="text-[15px] font-semibold text-red-600 mb-5 flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Danger Zone
            </h3>
            <Card className="border-red-100 shadow-none">
              <CardContent className="pt-6">
                <Button variant="destructive" onClick={handleClearData} className="font-semibold">
                  Clear All Leads Data
                </Button>
                <p className="text-[12px] text-[#64748b] mt-3 font-medium">
                  Permanently removes all prospects and call history across all campaigns. Export first!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
