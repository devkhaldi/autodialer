"use client";

import { useState, useMemo } from 'react';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { ChevronLeft, ChevronRight, PhoneCall, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useDialerStore } from '@/store/dialerStore';
import { useRouter } from 'next/navigation';

export function LeadsTable() {
  const { leads, activeListId } = useLeadStore();
  const { startSingleCall } = useDialerStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy map link:', err);
    }
  };

  // Filter leads by activeListId and search/status
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.listId !== activeListId) return false;
      
      const matchesSearch = 
        l.name.toLowerCase().includes(search.toLowerCase()) || 
        l.phoneNumber.includes(search);
      const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, activeListId, search, statusFilter]);

  // Paginated Slicing
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage]);

  const getStatusVariant = (status: string) => {
    if (status === 'Uncalled') return 'secondary';
    if (status === 'Interested' || status === 'Successful Sale') return 'success';
    if (status === 'Not Interested' || status === 'Failed' || status === 'DNC' || status === 'Wrong Number') return 'destructive';
    if (status === 'Callback Requested') return 'warning';
    return 'outline';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll table to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 w-full p-6">
      <div className="flex gap-3 mb-2 flex-wrap items-center">
        <Input 
          placeholder="Search leads..." 
          className="max-w-xs h-9" 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to page 1 on search
          }}
        />
        <select 
          className="bg-white border border-gray-300 text-sm rounded-md px-3 h-9 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1); // Reset to page 1 on filter
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Uncalled">Uncalled</option>
          <option value="Interested">Interested</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Callback Requested">Callback</option>
          <option value="Successful Sale">Successful Sale</option>
          <option value="DNC">DNC</option>
          <option value="No Answer">No Answer</option>
        </select>
        
        {activeListId && (
          <div className="ml-auto text-xs font-black text-blue-500 bg-blue-50/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-100/50">
            {paginatedLeads.length} of {filteredLeads.length} Results
          </div>
        )}
      </div>

      <div className="border border-white/20 rounded-[32px] overflow-hidden bg-white/30 backdrop-blur-md shadow-2xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 px-6 w-[40%]">Name</TableHead>
                <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 w-[30%]">Phone (Click to Call)</TableHead>
                <TableHead className="py-5 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 w-[30%]">Location Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map(lead => (
                <TableRow 
                  key={lead.id} 
                  title={lead.notes ? `NOTE: ${lead.notes}` : undefined}
                  className={`group transition-all duration-300 border-b border-white/40 last:border-0 ${lead.notes ? 'bg-amber-50/40 hover:bg-amber-100/60' : 'hover:bg-white/60'}`}
                >
                  <TableCell className="font-bold text-gray-900 py-6 px-6 tracking-tight">
                    <div className="flex items-center">
                      {lead.name}
                      <Badge variant={getStatusVariant(lead.status) as any} className="ml-3 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase">{lead.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => {
                        startSingleCall(lead);
                        router.push('/dialer');
                      }}
                      className="flex items-center font-mono text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all group-hover:scale-105 origin-left"
                    >
                      <PhoneCall className="h-3.5 w-3.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {lead.phoneNumber}
                    </button>
                  </TableCell>
                  <TableCell>
                    {lead.googleMapsUrl ? (
                      <button 
                        onClick={() => handleCopyUrl(lead.id, lead.googleMapsUrl!)}
                        className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest transition-all duration-300 px-3 py-1.5 rounded-lg border ${
                          copiedId === lead.id 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-blue-200 hover:text-blue-600'
                        }`}
                      >
                        {copiedId === lead.id ? (
                          <>
                            <Check className="h-3 w-3 mr-2" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-2" /> Copy Link
                          </>
                        )}
                      </button>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-gray-400">
                    {!activeListId 
                      ? "Choose a campaign to view leads." 
                      : (leads.filter(l => l.listId === activeListId).length === 0)
                        ? "No leads in this campaign file."
                        : "No results match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
