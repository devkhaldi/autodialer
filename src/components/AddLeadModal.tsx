"use client";

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useLeadStore } from '@/store/leadStore';

// Common IANA timezones for a sales dialer context
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
];

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyForm = () => ({
  name: '',
  phoneNumber: '',
  googleMapsUrl: '',
  hasWebsite: 'No',
  timezone: 'America/New_York',
  niche: '',
  notes: '',
});

export function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
  const [rows, setRows] = useState([emptyForm()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addLeads } = useLeadStore();

  const handleChange = (index: number, field: string, value: string) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addRow = () => setRows(prev => [...prev, emptyForm()]);
  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const valid = rows.filter(r => r.name.trim() && r.phoneNumber.trim());
    if (valid.length === 0) {
      setError('Each lead must have at least a Name and Phone Number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addLeads(valid);
      setRows([emptyForm()]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save leads.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Leads Manually" className="max-w-4xl">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Add one or more leads. Click  "+ Add Row" for multiple entries.</p>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Name *</th>
                <th className="px-3 py-2 text-left font-semibold">Phone *</th>
                <th className="px-3 py-2 text-left font-semibold">Timezone</th>
                <th className="px-3 py-2 text-left font-semibold">Niche</th>
                <th className="px-3 py-2 text-left font-semibold">Has Website</th>
                <th className="px-3 py-2 text-left font-semibold">Maps URL</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="bg-white">
                  <td className="px-3 py-2">
                    <Input value={row.name} onChange={e => handleChange(i, 'name', e.target.value)} placeholder="Business Name" className="h-8 text-xs" />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={row.phoneNumber} onChange={e => handleChange(i, 'phoneNumber', e.target.value)} placeholder="+1 212-555-0100" className="h-8 text-xs" />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={row.timezone}
                      onChange={e => handleChange(i, 'timezone', e.target.value)}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={row.niche} onChange={e => handleChange(i, 'niche', e.target.value)} placeholder="e.g. Plumbing" className="h-8 text-xs" />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={row.hasWebsite}
                      onChange={e => handleChange(i, 'hasWebsite', e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={row.googleMapsUrl} onChange={e => handleChange(i, 'googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." className="h-8 text-xs" />
                  </td>
                  <td className="px-3 py-2">
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          + Add Row
        </button>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : `Save ${rows.filter(r => r.name && r.phoneNumber).length} Lead(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
