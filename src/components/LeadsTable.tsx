"use client";

import { useState } from 'react';
import { useLeadStore } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';

export function LeadsTable() {
  const { leads } = useLeadStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      l.phoneNumber.includes(search) ||
      (l.niche && l.niche.toLowerCase().includes(search.toLowerCase()));
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
          placeholder="Search by name, phone, niche..." 
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
            <TableHead>Timezone</TableHead>
            <TableHead>Niche</TableHead>
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
              <TableCell className="text-xs text-gray-500">{lead.timezone || '-'}</TableCell>
              <TableCell>
                {lead.niche ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {lead.niche}
                  </span>
                ) : '-'}
              </TableCell>
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
              <TableCell className="max-w-[160px] truncate text-xs text-gray-400">
                {lead.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
          {filteredLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-gray-400">
                {leads.length === 0 ? "No leads yet. Add manually or upload an XLSX file." : "No leads match your current filters."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
