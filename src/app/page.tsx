"use client";

import { useLeadStore } from '@/store/leadStore';

export default function Dashboard() {
  const { leads } = useLeadStore();
  
  const totalLeads = leads.length;
  const calledLeads = leads.filter(l => l.status !== 'Uncalled').length;
  const successLeads = leads.filter(l => l.status === 'Interested' || l.status === 'Successful Sale').length;
  
  const successRate = calledLeads > 0 ? Math.round((successLeads / calledLeads) * 100) : 0;
  const activeQueue = leads.filter(l => l.status === 'Uncalled').length;

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500">Overview of your auto dialer performance today.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Calls Made</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">{calledLeads}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">{successRate}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Remaining Queue</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">{activeQueue} leads</p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {calledLeads === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 py-12">
            No calls made yet today.
          </div>
        ) : (
          <div className="space-y-4">
             {leads.filter(l => l.status !== 'Uncalled').slice().reverse().slice(0, 5).map(lead => (
               <div key={lead.id} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-gray-900 font-medium">{lead.name}</p>
                    <p className="text-sm text-gray-400">{lead.phoneNumber}</p>
                  </div>
                  <div className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-medium">
                    {lead.status}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
