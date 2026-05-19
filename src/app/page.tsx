"use client";

import { useLeadStore, Lead } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Phone, TrendingUp, Layers, Calendar, BarChart3, Waves } from 'lucide-react';

export default function Dashboard() {
  const { leads, lists } = useLeadStore();
  
  // Temporal Helpers
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - (now.getDay() * 24 * 60 * 60 * 1000);
  
  // Global Metrics
  const totalLeads = leads.length;
  const calledLeads = leads.filter(l => l.status !== 'Uncalled');
  const totalCalled = calledLeads.length;
  
  const callsToday = calledLeads.filter(l => l.updatedAt && new Date(l.updatedAt).getTime() >= todayStart).length;
  const callsThisWeek = calledLeads.filter(l => l.updatedAt && new Date(l.updatedAt).getTime() >= weekStart).length;

  const totalSuccess = leads.filter(l => l.status === 'Interested' || l.status === 'Successful Sale').length;
  const globalSuccessRate = totalCalled > 0 ? Math.round((totalSuccess / totalCalled) * 100) : 0;
  
  const statusCounts = leads.reduce((acc: any, lead) => {
    if (lead.status !== 'Uncalled') {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
    }
    return acc;
  }, {});

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
    <div className="p-12 space-y-12 bg-gradient-to-tr from-gray-50 to-white min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <BarChart3 className="h-6 w-6" />
             </div>
             <h1 className="text-5xl font-black tracking-tight text-gray-900 leading-none">Intelligence</h1>
          </div>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-[0.3em] flex items-center">
             <Waves className="h-3 w-3 mr-2 text-blue-500 animate-pulse" />
             Live Outreach Performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white/40 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/60 shadow-xl shadow-gray-100/50 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Today Performance</p>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-black text-gray-900 leading-none">{callsToday}</span>
                  <span className="text-[10px] text-gray-400 font-bold mb-1">CALLS</span>
                </div>
              </div>
           </div>
           <div className="bg-white/40 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/60 shadow-xl shadow-gray-100/50 flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Weekly Velocity</p>
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-black text-gray-900 leading-none">{callsThisWeek}</span>
                  <span className="text-[10px] text-gray-400 font-bold mb-1">TOTAL</span>
                </div>
              </div>
           </div>
        </div>
      </header>
      
      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-2xl shadow-gray-200/40 relative overflow-hidden group">
          <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-gray-100 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 relative z-10">Total Network</p>
          <p className="text-5xl font-black text-gray-900 leading-tight relative z-10">{totalLeads.toLocaleString()}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-gray-400">
             <span className="text-green-500 mr-2">↑ Ready</span> active data
          </div>
        </div>
        
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-2xl shadow-gray-200/40 relative overflow-hidden group">
          <Phone className="absolute -right-4 -bottom-4 h-24 w-24 text-gray-100 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 relative z-10">Engagements</p>
          <p className="text-5xl font-black text-gray-900 leading-tight relative z-10">{totalCalled.toLocaleString()}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-blue-500">
             <span className="mr-2">⚡ Processing</span> {Math.round((totalCalled/totalLeads)*100 || 0)}% coverage
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] shadow-2xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <TrendingUp className="h-20 w-20 text-white" />
          </div>
          <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-4 relative z-10">Market Success</p>
          <p className="text-6xl font-black text-white leading-tight relative z-10">{globalSuccessRate}%</p>
          <div className="mt-4 text-xs font-bold text-blue-200">
             Top Tier Performance
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/60 shadow-2xl shadow-gray-200/40 relative overflow-hidden group">
          <Layers className="absolute -right-4 -bottom-4 h-24 w-24 text-gray-100 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 relative z-10">Active Segments</p>
          <p className="text-5xl font-black text-indigo-600 leading-tight relative z-10">{lists.length}</p>
          <div className="mt-4 text-xs font-bold text-gray-400">
             Campaigns Optimized
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Call Status Breakdown */}
        <div className="lg:col-span-1 space-y-8">
           <h3 className="text-2xl font-black text-gray-900 px-2 tracking-tight">Outcome Signals</h3>
           <div className="bg-white/60 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-gray-200/30 border border-white p-10 space-y-6">
              {Object.entries(statusCounts).sort((a: any, b: any) => b[1] - a[1]).map(([status, count]: any) => (
                <div key={status} className="flex flex-col space-y-2">
                   <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-gray-500 uppercase tracking-widest">{status}</span>
                      <span className="font-black text-gray-900 text-lg opacity-60">{count}</span>
                   </div>
                   <div className="w-full bg-gray-100/50 h-3 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full shadow-inner transition-all duration-1000 ${status === 'Interested' || status === 'Successful Sale' ? 'bg-gradient-to-r from-green-400 to-emerald-600' : status === 'Failed' || status === 'DNC' ? 'bg-gradient-to-r from-red-400 to-rose-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`}
                        style={{ width: `${Math.round((count / totalCalled) * 100)}%` }}
                      />
                   </div>
                </div>
              ))}
              {totalCalled === 0 && <p className="text-gray-400 text-center py-12 italic font-medium">Capture engagements to reveal insights.</p>}
           </div>
        </div>

        {/* Per-List Breakdown Table */}
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-black text-gray-900 px-2 tracking-tight">Campaign Intelligence</h3>
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] shadow-2xl shadow-gray-200/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/30 border-b border-gray-100">
                <TableRow className="border-none h-16">
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-10">Segment</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Depth</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center">Reach Progress</TableHead>
                  <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right px-10">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsByList.map((item, idx) => (
                  <TableRow key={`${item.id}-${idx}`} className="hover:bg-white/60 transition-all border-b border-gray-100/20 h-24">
                    <TableCell className="font-black text-gray-900 text-xl px-10">{item.name}</TableCell>
                    <TableCell className="text-center font-bold text-gray-400">{item.total}</TableCell>
                    <TableCell className="text-center">
                       <div className="inline-flex flex-col items-center">
                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${item.remaining > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                            {Math.round(((item.total - item.remaining) / item.total) * 100)}% Engaged
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right px-10">
                       <div className="inline-flex flex-col items-end">
                         <span className="font-black text-green-600 text-3xl leading-none">{item.successRate}%</span>
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">{item.success} HITS</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
