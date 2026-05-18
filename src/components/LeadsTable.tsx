"use client";

import { useState } from 'react';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

export function LeadsTable() {
  const { leads, activeListId, updateLeadStatus } = useLeadStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter leads by activeListId and search/status
  const filteredLeads = leads.filter(l => {
    if (l.listId !== activeListId) return false;
    
    const matchesSearch = 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      l.phoneNumber.includes(search);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    if (status === 'Uncalled') return 'secondary';
    if (status === 'Interested' || status === 'Successful Sale') return 'success';
    if (status === 'Not Interested' || status === 'Failed' || status === 'DNC' || status === 'Wrong Number') return 'destructive';
    if (status === 'Callback Requested') return 'warning';
    return 'outline';
  };

  return (
    <div className="space-y-4 w-full p-6">
      <div className="flex gap-3 mb-2 flex-wrap">
        <Input 
          placeholder="Search by name or phone..." 
          className="max-w-xs" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="bg-white border border-gray-300 text-sm rounded-md px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Google Maps</TableHead>
            <TableHead>Has Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map(lead => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium text-gray-900">{lead.name}</TableCell>
              <TableCell className="font-mono text-sm">{lead.phoneNumber}</TableCell>
              <TableCell>
                {lead.googleMapsUrl ? (
                  <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                    View Map
                  </a>
                ) : '-'}
              </TableCell>
              <TableCell>
                <span className={`text-xs font-medium ${lead.hasWebsite === 'Yes' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {lead.hasWebsite}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status) as any}>{lead.status}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-gray-400">
                {lead.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
          {filteredLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                {!activeListId 
                  ? "Select a lead list to view data." 
                  : (leads.filter(l => l.listId === activeListId).length === 0)
                    ? "This list is empty."
                    : "No leads match your current filters."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
