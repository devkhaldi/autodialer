"use client";

import { useLeadStore } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { History, AlignStartVertical } from 'lucide-react';

export default function HistoryPage() {
  const { leads, activeListId, lists } = useLeadStore();
  
  const activeList = lists.find(l => l.id === activeListId);
  const historyLeads = leads.filter(l => l.status !== 'Uncalled' && l.listId === activeListId);

  const getStatusVariant = (status: string) => {
    if (status === 'Interested' || status === 'Successful Sale') return 'default';
    if (status === 'Not Interested' || status === 'Failed' || status === 'DNC' || status === 'Wrong Number' || status === 'Customer Hang Up') return 'destructive';
    if (status === 'Callback Requested' || status === 'Busy' || status === 'Dead Air') return 'secondary';
    return 'outline';
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="h-[72px] px-8 flex items-center justify-between border-b border-[#e2e8f0] bg-white sticky top-0 z-10">
        <div className="flex items-center text-[15px] font-semibold text-[#0f172a]">
           <History className="w-5 h-5 mr-3 text-gray-400" />
           Call History Log
        </div>
      </header>
      
      <div className="flex-1 p-8 md:p-10 bg-white">
        {!activeListId ? (
          <div className="flex flex-col items-center justify-center p-20 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-center shadow-sm">
            <h2 className="text-[16px] font-semibold text-[#0f172a] mb-2">No campaign selected</h2>
            <p className="text-[#64748b] text-[14px]">Please select a list from the Prospects page to view history.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#0f172a] flex items-center">
                 <AlignStartVertical className="h-4 w-4 mr-2 text-[#7c3aed]" />
                 Logs for campaign: <span className="text-[#7c3aed] ml-1">{activeList?.name}</span>
              </h3>
            </div>
            
            <div className="bg-white border border-[#e2e8f0] rounded-[14px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <Table>
                <TableHeader className="bg-[#f8fafc]">
                  <TableRow>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Disposition Status</TableHead>
                    <TableHead className="w-[40%]">Agent Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLeads.slice().reverse().map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-semibold text-[#0f172a]">{lead.name}</TableCell>
                      <TableCell className="font-mono text-[#475569]">{lead.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(lead.status) as any}>{lead.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[#64748b] text-[13px] italic">
                        {lead.notes || 'No notes left.'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {historyLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-[#64748b] text-[14px]">
                        No call history for this list yet. Start dialing!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
