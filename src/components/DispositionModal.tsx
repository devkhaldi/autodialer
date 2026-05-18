"use client";

import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

const DISPOSITIONS: Lead['status'][] = [
  'No Answer', 'Busy', 'Answering Machine', 'Callback Requested', 
  'Interested', 'Not Interested', 'Wrong Number', 'Successful Sale', 
  'Failed', 'DNC'
];

import { useState } from 'react';

export function DispositionModal() {
  const { status, activeLeadId, setStatus, popQueue, setActiveLead, delaySeconds } = useDialerStore();
  const { leads, updateLeadStatus } = useLeadStore();
  const [selectedDisposition, setSelectedDisposition] = useState<Lead['status'] | null>(null);
  const [notes, setNotes] = useState('');

  const isOpen = status === 'DISPOSITION';
  const currentLead = leads.find(l => l.id === activeLeadId);

  if (!isOpen || !currentLead) return null;

  const handleSave = () => {
    if (!selectedDisposition) return;
    
    updateLeadStatus(currentLead.id, selectedDisposition, notes);
    setSelectedDisposition(null);
    setNotes('');
    
    const nextLeadId = popQueue();
    if (nextLeadId) {
      setActiveLead(nextLeadId);
      setStatus('DIALING');
    } else {
      setStatus('IDLE');
      setActiveLead(null);
    }
  };

  const getDispColor = (disp: string, selected: boolean) => {
    if (selected) return 'bg-blue-600 border-blue-600 text-white';
    if (['Interested', 'Successful Sale'].includes(disp)) return 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
    if (['Not Interested', 'DNC', 'Wrong Number', 'Failed'].includes(disp)) return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100';
    if (['Callback Requested'].includes(disp)) return 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';
    return 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title={`Disposition: ${currentLead.name}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {DISPOSITIONS.map((disp) => (
            <button
              key={disp}
              onClick={() => setSelectedDisposition(disp)}
              className={`p-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${getDispColor(disp, selectedDisposition === disp)}`}
            >
              {disp}
            </button>
          ))}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
          <textarea
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none transition-all"
            placeholder="Add relevant outcome notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSave} 
            disabled={!selectedDisposition}
            className="w-full md:w-auto"
          >
            Save & Continue to Next Lead
          </Button>
        </div>
      </div>
    </Modal>
  );
}
