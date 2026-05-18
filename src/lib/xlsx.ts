import * as XLSX from 'xlsx';
import { Lead } from '@/store/leadStore';

/**
 * Normalizes a phone number to the most common format found in the batch.
 * Detects the dominant country prefix (e.g. +1) and applies it to all numbers.
 */
function normalizePhoneNumbers(rawPhones: string[]): string[] {
  const digits = rawPhones.map(p => p.replace(/\D/g, ''));

  // Count how many already have a country code (11+ digits starting with 1)
  const withCountryCode = digits.filter(d => d.length >= 11 && d.startsWith('1'));
  const dominantPrefix = withCountryCode.length > rawPhones.length / 2 ? '+1' : null;

  return digits.map((d, i) => {
    const raw = rawPhones[i];
    if (!d) return raw; // return as-is if empty

    if (dominantPrefix === '+1') {
      // Strip leading 1 if already there, then reformat
      const core = d.startsWith('1') && d.length === 11 ? d.slice(1) : d;
      if (core.length === 10) {
        return `+1 ${core.slice(0, 3)}-${core.slice(3, 6)}-${core.slice(6)}`;
      }
    }
    // Default: just return with + prefix if 10+ digits
    if (d.length >= 10) {
      return `+${d}`;
    }
    return raw;
  });
}

export async function parseLeadsFromExcel(file: File): Promise<Lead[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        // Extract raw phone strings first for normalization
        const rawPhones = rawData.map(row =>
          String(row['Phone Number'] || row['phone number'] || row['Phone'] || row['phone'] || row['Tel'] || '')
        );

        // Normalize all phones at once to detect dominant format
        const normalizedPhones = normalizePhoneNumbers(rawPhones);
        
        const leads = rawData.map((row, i) => ({
          id: crypto.randomUUID(),
          name: row['Name'] || row['name'] || row['First Name'] || row['Company'] || '',
          phoneNumber: normalizedPhones[i],
          googleMapsUrl: row['Google Maps URL'] || row['google maps url'] || row['Map URL'] || row['maps url'] || '',
          hasWebsite: row['Has Website'] || row['has website'] || row['Website'] || row['website'] ? 'Yes' : 'No',
          timezone: row['Timezone'] || row['timezone'] || row['Time Zone'] || '',
          niche: row['Niche'] || row['niche'] || row['Industry'] || row['industry'] || '',
          notes: row['Notes'] || row['notes'] || '',
          status: 'Uncalled' as const,
        })).filter(l => l.phoneNumber && l.phoneNumber.trim() !== '');
        
        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function exportLeadsToExcel(leads: Lead[], filename = 'dialer_campaign_results.xlsx') {
  const data = leads.map(l => ({
    'Name': l.name,
    'Phone Number': l.phoneNumber,
    'Timezone': l.timezone,
    'Niche': l.niche,
    'Google Maps URL': l.googleMapsUrl,
    'Has Website': l.hasWebsite,
    'Status': l.status,
    'Notes': l.notes
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  XLSX.writeFile(workbook, filename);
}
