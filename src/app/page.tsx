"use client";

import { useLeadStore, Lead } from '@/store/leadStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Dashboard() {
  const { leads, lists } = useLeadStore();
  
  // Global Metrics
  const totalLeads = leads.length;
  const totalCalled = leads.filter(l => l.status !== 'Uncalled').length;
  const totalSuccess = leads.filter(l => l.status === 'Interested' || l.status === 'Successful Sale').length;
  const globalSuccessRate = totalCalled > 0 ? Math.round((totalSuccess / totalCalled) * 100) : 0;
  
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
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Global Dashboard</h1>
        <p className="text-gray-500">Summary of all active campaigns and performance.</p>
      </header>
      
      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Overall Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{totalCalled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Global Success</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{globalSuccessRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{lists.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-List Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Performance Breakdown</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Total Leads</TableHead>
              <TableHead>Calls Made</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Queue Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyticsByList.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-gray-900">{item.name}</TableCell>
                <TableCell>{item.total}</TableCell>
                <TableCell>{item.called}</TableCell>
                <TableCell className="font-medium text-green-600">{item.successRate}%</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${item.remaining > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {item.remaining} pending
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {lists.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  No active campaigns found. Please upload a lead file to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
