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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLeads } = useLeadStore();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const parsedLeads = await parseLeadsFromExcel(file);
      if (parsedLeads.length === 0) {
        setError("No valid leads found. Please ensure the file has phone numbers.");
        setLoading(false);
        return;
      }
      // Persist every lead to Supabase via addLeads
      await addLeads(parsedLeads.map(({ id, status, ...rest }) => rest));
      onClose();
    } catch (err) {
      setError("Failed to parse the Excel file. Make sure it's a valid .xlsx or .csv");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Prospects">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          Upload an .xlsx file with columns: <strong>Name</strong>, <strong>Phone Number</strong>, <strong>Timezone</strong>, <strong>Niche</strong>, <strong>Google Maps URL</strong>, <strong>Has Website</strong>. Rows without a valid phone number are skipped.
        </p>
        <Input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="cursor-pointer file:text-gray-700 file:bg-gray-100 file:px-4 file:py-1 file:rounded-md file:mr-4 file:border-none file:hover:bg-gray-200"
        />
        {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg">{error}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Uploading..." : "Upload & Save to Database"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
