"use client";

import { useEffect, useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { UploadModal } from '@/components/UploadModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { useLeadStore } from '@/store/leadStore';
import { exportLeadsToExcel } from '@/lib/xlsx';
import { Button } from '@/components/ui/Button';
import { Download, Upload, UserPlus, RefreshCw } from 'lucide-react';

export default function LeadsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { leads, fetchLeads, loading } = useLeadStore();

  // Load leads from Supabase on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="p-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Prospect Leads</h1>
          <p className="text-gray-500">Manage, import, and export your cold outreach leads.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="ghost" onClick={fetchLeads} size="sm" title="Refresh from database">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => exportLeadsToExcel(leads)} disabled={leads.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export XLSX
          </Button>
          <Button variant="secondary" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import XLSX
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Leads
          </Button>
        </div>
      </header>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <LeadsTable />
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AddLeadModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
