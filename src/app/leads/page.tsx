"use client";

import { useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { UploadModal } from '@/components/UploadModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { useLeadStore } from '@/store/leadStore';
import { exportLeadsToExcel } from '@/lib/xlsx';
import { Button } from '@/components/ui/Button';
import { Download, Upload, UserPlus, Trash2, FolderOpen, Users } from 'lucide-react';

export default function LeadsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { leads, lists, activeListId, setActiveList, deleteList } = useLeadStore();

  const activeList = lists.find(l => l.id === activeListId);
  const activeLeads = leads.filter(l => l.listId === activeListId);

  const handleDeleteList = () => {
    if (!activeListId) return;
    if (confirm(`Are you sure you want to delete the list "${activeList?.name}" and all its leads?`)) {
      deleteList(activeListId);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-[#e2e8f0] bg-white sticky top-0 z-10">
        <div className="flex items-center text-[15px] font-semibold text-[#0f172a]">
           <Users className="w-5 h-5 mr-3 text-gray-400" />
           Prospect Leads
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportLeadsToExcel(activeLeads)} disabled={activeLeads.length === 0} className="font-semibold text-[13px]">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export XLSX
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)} className="font-semibold text-[13px]">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import Data
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} disabled={!activeListId} className="font-semibold text-[13px] bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Leads
          </Button>
        </div>
      </header>

      <div className="flex-1 p-8 md:p-10 bg-white">
        
        <div className="bg-[#f0f9ff]/50 border border-[#e0f2fe] rounded-[16px] p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-[15px] font-semibold text-[#0f172a] flex items-center">
               <FolderOpen className="h-4 w-4 mr-2 text-[#7c3aed]" />
               Active Campaign List
             </h3>
             {activeListId && (
               <Button variant="ghost" size="sm" onClick={handleDeleteList} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                 <Trash2 className="w-4 h-4 mr-1.5" /> Delete List
               </Button>
             )}
           </div>
           
           <div className="flex items-center gap-4 bg-white p-4 rounded-[12px] border border-[#e2e8f0] shadow-sm">
              <select 
                className="flex-1 bg-white border border-[#cbd5e1] text-[14px] font-medium rounded-lg px-3 py-2 text-[#0f172a] shadow-sm focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] outline-none transition-colors"
                value={activeListId || ''}
                onChange={(e) => setActiveList(e.target.value)}
              >
                {lists.length === 0 && <option value="">No lists uploaded</option>}
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
              {activeListId && (
                 <div className="shrink-0 text-[13px] font-semibold text-[#64748b] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
                   {activeLeads.length} leads total
                 </div>
              )}
           </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-[14px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <LeadsTable />
        </div>

      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AddLeadModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
