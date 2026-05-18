"use client";

import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore } from '@/store/leadStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { delaySeconds, setDelaySeconds } = useDialerStore();
  const { clearLeads } = useLeadStore();

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all leads? This cannot be undone.")) {
      clearLeads();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500">Configure your dialer preferences.</p>
      </header>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dialer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delay Between Calls (Seconds)</label>
              <select 
                className="w-full bg-white border border-gray-300 text-sm rounded-md px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
              >
                <option value={0}>No Delay</option>
                <option value={5}>5 Seconds</option>
                <option value={10}>10 Seconds (Recommended)</option>
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                The amount of time the dialer waits before automatically starting the next call in the queue.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearData}>
              Clear All Leads Data
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              This will remove all loaded prospects and call history from the dashboard. Make sure you exported your data first.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
