"use client";

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { parseLeadsFromExcel } from '@/lib/xlsx';
import { useLeadStore } from '@/store/leadStore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLeadsToList } = useLeadStore();

  const handleUpload = async () => {
    if (!file) return;
    if (!listName.trim()) {
      setError("Please provide a name for this list.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const parsedLeads = await parseLeadsFromExcel(file);
      if (parsedLeads.length === 0) {
        setError("No valid leads found. Please ensure the file has phone numbers.");
        setLoading(false);
        return;
      }
      
      // Add leads to a new named list
      addLeadsToList(listName, parsedLeads);
      
      setFile(null);
      setListName('');
      onClose();
    } catch (err) {
      setError("Failed to parse the Excel file. Make sure it's a valid .xlsx or .csv");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New List">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
          <Input 
            placeholder="e.g. Q2 Real Estate Leads" 
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            disabled={loading}
          />
          <p className="text-[10px] text-gray-400 mt-1">This will help you keep different files separated.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select File (.xlsx, .csv)</label>
          <Input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer file:text-gray-700 file:bg-gray-100 file:px-4 file:py-1 file:rounded-md file:mr-4 file:border-none file:hover:bg-gray-200"
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || !listName.trim() || loading}>
            {loading ? "Processing..." : "Upload & Create List"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
