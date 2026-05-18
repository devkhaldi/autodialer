"use client";

import { useLeadStore } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export default function HistoryPage() {
  const { leads, activeListId, lists } = useLeadStore();
  
  const activeList = lists.find(l => l.id === activeListId);
  const historyLeads = leads.filter(l => l.status !== 'Uncalled' && l.listId === activeListId);

  const getStatusVariant = (status: string) => {
    if (status === 'Interested' || status === 'Successful Sale') return 'success';
    if (status === 'Not Interested' || status === 'Failed' || status === 'DNC' || status === 'Wrong Number') return 'destructive';
    if (status === 'Callback Requested') return 'warning';
    return 'outline';
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Call History</h1>
        <p className="text-gray-500">
          {activeList 
             ? `Logs for campaign: ${activeList.name}` 
             : "Select a list to view call history."}
        </p>
      </header>
      
      {!activeListId ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 font-medium">No campaign selected.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLeads.slice().reverse().map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-gray-900">{lead.name}</TableCell>
                  <TableCell className="font-mono text-sm">{lead.phoneNumber}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(lead.status) as any}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] text-xs text-gray-400 truncate" title={lead.notes}>
                    {lead.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {historyLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                    No call history for this list yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
