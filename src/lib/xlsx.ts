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
    if (!d) return raw;

    if (dominantPrefix === '+1') {
      const core = d.startsWith('1') && d.length === 11 ? d.slice(1) : d;
      if (core.length === 10) {
        return `+1 ${core.slice(0, 3)}-${core.slice(3, 6)}-${core.slice(6)}`;
      }
    }
    if (d.length >= 10) {
      return `+${d}`;
    }
    return raw;
  });
}

/**
 * Helper to process an array in chunks asynchronously to avoid blocking the UI thread.
 */
async function chunkedMap<T, R>(
  items: T[], 
  mapper: (item: T, index: number) => R, 
  chunkSize = 500
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map((item, index) => mapper(item, i + index));
    results.push(...chunkResults);
    // Give the browser a chance to handle UI events
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return results;
}

export async function parseLeadsFromExcel(file: File): Promise<Omit<Lead, 'id' | 'status' | 'listId'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        if (!workbook || !workbook.SheetNames.length) {
          throw new Error("The Excel file seems to be empty or invalid.");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          throw new Error("Could not find the first sheet in the Excel file.");
        }
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        if (!rawData || rawData.length === 0) {
          throw new Error("No data found in the Excel sheet.");
        }

        // Extract raw phone strings
        const rawPhones = rawData.map(row =>
          String(row['Phone Number'] || row['phone number'] || row['Phone'] || row['phone'] || row['Tel'] || '')
        );

        // Normalize phones (this is relatively fast, but we can chunk the next part)
        const normalizedPhones = normalizePhoneNumbers(rawPhones);
        
        // Process mapping in chunks to keep UI responsive
        const leads = await chunkedMap(rawData, (row, i) => ({
          name: row['Name'] || row['name'] || row['First Name'] || row['Company'] || '',
          phoneNumber: normalizedPhones[i],
          googleMapsUrl: row['Google Maps URL'] || row['google maps url'] || row['Map URL'] || row['maps url'] || '',
          hasWebsite: row['Has Website'] || row['has website'] || row['Website'] || row['website'] ? 'Yes' : 'No',
          notes: row['Notes'] || row['notes'] || '',
        }));

        // Filter out empty phone numbers
        const validLeads = leads.filter(l => l.phoneNumber && l.phoneNumber.trim() !== '');
        
        resolve(validLeads);
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
