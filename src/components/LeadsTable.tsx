"use client";

import { useState, useMemo } from 'react';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

export function LeadsTable() {
  const { leads, activeListId } = useLeadStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

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
          <div className="ml-auto text-xs text-gray-400 font-medium">
            Showing {paginatedLeads.length} of {filteredLeads.length} leads
          </div>
        )}
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Google Maps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map(lead => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium text-gray-900">{lead.name}</TableCell>
                <TableCell className="font-mono text-sm">{lead.phoneNumber}</TableCell>
                <TableCell>
                  {lead.googleMapsUrl ? (
                    <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                      View
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(lead.status) as any}>{lead.status}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-gray-400" title={lead.notes}>
                  {lead.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
            {filteredLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-gray-400">
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
