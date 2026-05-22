"use client";

import { useLeadStore } from '@/store/leadStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Users, Phone, TrendingUp, Layers, MousePointer2, Settings2, BarChart2, BellRing, BriefcaseBusiness, Globe, Box } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { leads, lists } = useLeadStore();
  
  const totalLeads = leads.length;
  const calledLeads = leads.filter(l => l.status !== 'Uncalled');
  const totalCalled = calledLeads.length;
  
  const totalSuccess = leads.filter(l => l.status === 'Interested' || l.status === 'Successful Sale').length;
  const globalSuccessRate = totalCalled > 0 ? Math.round((totalSuccess / totalCalled) * 100) : 0;
  
  const statusCounts = leads.reduce((acc: Record<string, number>, lead) => {
    if (lead.status !== 'Uncalled') {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
    }
    return acc;
  }, {});

  const getStatusColor = (status: string) => {
    if (status === 'Interested' || status === 'Successful Sale') return 'bg-[#10b981]';
    if (status === 'Failed' || status === 'DNC' || status === 'Dead Air') return 'bg-[#ef4444]';
    if (status === 'Callback Requested' || status === 'Busy' || status === 'Customer Hang Up') return 'bg-[#f59e0b]';
    return 'bg-[#7c3aed]';
  };

  const analyticsByList = lists.map(list => {
    const listLeads = leads.filter(l => l.listId === list.id);
    const called = listLeads.filter(l => l.status !== 'Uncalled').length;
    const success = listLeads.filter(l => l.status === 'Interested' || l.status === 'Successful Sale').length;
    const successRate = called > 0 ? Math.round((success / called) * 100) : 0;
    return {
      ...list,
      total: listLeads.length,
      called,
      success,
      successRate,
      remaining: listLeads.filter(l => l.status === 'Uncalled').length
    };
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header - Very clean, border bottom */}
      <header className="h-[72px] px-8 flex items-center border-b border-[#e2e8f0] bg-white sticky top-0 z-10">
        <div className="flex items-center text-[15px] font-semibold text-[#0f172a]">
           <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
           Dashboard Overview
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-10 bg-white">
        
        {totalLeads === 0 ? (
          /* Empty State matches Lantern's centered dotted background */
          <div className="flex flex-col items-center justify-center p-20 bg-dot-pattern rounded-3xl border border-[#e2e8f0]/60 mb-10">
            <div className="w-16 h-16 bg-[#f3e8ff] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#e9d5ff]">
              <Database className="w-8 h-8 text-[#7c3aed]" />
            </div>
            <h2 className="text-[20px] font-bold text-[#0f172a] mb-2">You don't have any leads yet</h2>
            <p className="text-[#64748b] text-[15px] text-center max-w-sm mb-8 leading-relaxed">
              Select an import method or create a new campaign from scratch to begin autodialing.
            </p>
          </div>
        ) : (
          /* Stats Grid */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-[12px] border border-[#e2e8f0] bg-white text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Total Network</p>
              <p className="text-[28px] font-bold text-[#0f172a]">{totalLeads.toLocaleString()}</p>
            </div>
            <div className="p-5 rounded-[12px] border border-[#e2e8f0] bg-white text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Engagements</p>
              <p className="text-[28px] font-bold text-[#0f172a]">{totalCalled.toLocaleString()}</p>
            </div>
            <div className="p-5 rounded-[12px] border border-[#e2e8f0] bg-white text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Success Rate</p>
              <p className="text-[28px] font-bold text-[#7c3aed]">{globalSuccessRate}%</p>
            </div>
            <div className="p-5 rounded-[12px] border border-[#e2e8f0] bg-white text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#64748b] mb-1">Active Campaigns</p>
              <p className="text-[28px] font-bold text-[#0f172a]">{lists.length}</p>
            </div>
          </div>
        )}

        {/* Start Calling Block (Matches "Start from scratch" purple block) */}
        <div className="bg-[#fcfaff] border border-[#e9d5ff] rounded-[14px] p-6 flex flex-row items-center justify-between mb-8 shadow-sm">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0f172a] flex items-center mb-1">
              Start calling session <svg className="w-4 h-4 ml-1.5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </h3>
            <p className="text-[14px] text-[#64748b]">Launch the autodialer to automatically engage with your prospects.</p>
          </div>
          <Link href="/dialer">
            <Button className="font-semibold px-6 shadow-[0_2px_10px_rgba(124,58,237,0.2)]">Launch Workspace</Button>
          </Link>
        </div>

        {/* Analytics Sections (Matches "Churn risk agent" light blue section layout) */}
        <div className="space-y-6">
          {/* Signal & Activity (Blue Tint) */}
          <div className="bg-[#f0f9ff]/50 border border-[#e0f2fe] rounded-[16px] p-6 pb-8">
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-[15px] font-semibold text-[#0f172a]">Outcome Signals</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="bg-white rounded-[12px] p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] border border-[#e2e8f0]">
                  <p className="text-[13px] font-semibold text-[#0f172a] mb-1 flex items-center">
                    {status} <svg className="w-3.5 h-3.5 ml-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </p>
                  <p className="text-[13px] text-[#64748b] leading-tight mb-4">
                    Tracked engagement for this particular lead outcome.
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                    <span>{count} Leads</span>
                    <span>{Math.round((count / Math.max(1, totalCalled)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${Math.round((count / totalCalled) * 100)}%` }}
                      />
                  </div>
                </div>
              ))}
              {totalCalled === 0 && (
                <div className="col-span-full py-8 text-center text-[#64748b] text-[14px]">
                  No call outcomes recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Campaign Intelligence (Orange/Amber Tint like "Expansion Agent") */}
          <div className="bg-[#fffbeb]/50 border border-[#fef3c7] rounded-[16px] p-6 pb-8">
             <div className="flex items-center justify-between mb-5 px-1">
               <h3 className="text-[15px] font-semibold text-[#0f172a]">Campaign Intelligence</h3>
               <span className="text-[13px] font-medium text-[#7c3aed] cursor-pointer hover:underline">View all {lists.length} campaigns</span>
             </div>

             <div className="bg-white rounded-[12px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <TableRow className="border-none">
                      <TableHead className="font-semibold text-[#334155] h-[48px]">Campaign Segment</TableHead>
                      <TableHead className="font-semibold text-[#334155] h-[48px] text-center">Volume</TableHead>
                      <TableHead className="font-semibold text-[#334155] h-[48px] text-center">Progress</TableHead>
                      <TableHead className="font-semibold text-[#334155] h-[48px] text-right pr-6">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsByList.map((item, idx) => (
                      <TableRow key={`${item.id}-${idx}`} className="hover:bg-[#f8fafc]/50 border-b border-[#f1f5f9]">
                        <TableCell className="font-semibold text-[#0f172a] py-4">{item.name}</TableCell>
                        <TableCell className="text-center font-medium text-[#64748b]">{item.total}</TableCell>
                        <TableCell className="text-center">
                           <span className="text-[13px] font-medium bg-[#f1f5f9] text-[#475569] px-2.5 py-1 rounded-md">
                             {Math.round(((item.total - item.remaining) / item.total) * 100)}% Engaged
                           </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <span className="font-semibold text-[#10b981] text-[15px]">{item.successRate}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lists.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-[#64748b] py-8">No campaigns created yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Temporary icon to avoid import issues
function Database(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>;
}
