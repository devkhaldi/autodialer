"use client";

import { useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { UploadModal } from '@/components/UploadModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { useLeadStore } from '@/store/leadStore';
import { exportLeadsToExcel } from '@/lib/xlsx';
import { Button } from '@/components/ui/Button';
import { Download, Upload, UserPlus, Trash2, FolderOpen } from 'lucide-react';

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
    <div className="p-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Prospect Leads</h1>
          <p className="text-gray-500">Manage separate lead lists and campaigns.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={() => exportLeadsToExcel(activeLeads)} disabled={activeLeads.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export XLSX
          </Button>
          <Button variant="secondary" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import XLSX
          </Button>
          <Button onClick={() => setIsAddOpen(true)} disabled={!activeListId}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Leads
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center text-gray-500 text-sm font-medium shrink-0">
          <FolderOpen className="w-4 h-4 mr-2" />
          Active List:
        </div>
        <select 
          className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
          value={activeListId || ''}
          onChange={(e) => setActiveList(e.target.value)}
        >
          {lists.length === 0 && <option value="">No lists uploaded</option>}
          {lists.map(list => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>
        
        {activeListId && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium italic">
              {activeLeads.length} leads in this list
            </span>
            <Button variant="ghost" size="sm" onClick={handleDeleteList} className="text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <LeadsTable />
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AddLeadModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
