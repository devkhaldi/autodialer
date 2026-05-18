import * as XLSX from 'xlsx';
import { Lead } from '@/store/leadStore';

/**
 * Advanced phone normalization.
 * Scans the batch for existing country codes and applies the dominant one 
 * to numbers that are missing it.
 */
function normalizePhoneNumbers(rawPhones: string[]): string[] {
  // 1. Clean numbers to digits or digits with leading +
  const cleaned = rawPhones.map(p => {
    const hasPlus = p.trim().startsWith('+');
    const digits = p.replace(/\D/g, '');
    return hasPlus ? `+${digits}` : digits;
  });

  // 2. Identify existing country codes
  const prefixes: Record<string, number> = {};
  cleaned.forEach(p => {
    if (p.startsWith('+')) {
      // Common codes: +1, +44, +33 etc (take first 1-3 digits after +)
      // For simplicity, we'll look for +1 specifically or the leading digits
      const code = p.slice(0, 2); // +1, +4 etc
      prefixes[code] = (prefixes[code] || 0) + 1;
    } else if (p.length === 11 && p.startsWith('1')) {
      prefixes['+1'] = (prefixes['+1'] || 0) + 1;
    }
  });

  // 3. Determine dominant prefix
  let dominantPrefix = '+1'; // Default fallback
  let maxCount = 0;
  Object.entries(prefixes).forEach(([pref, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantPrefix = pref;
    }
  });

  // 4. Apply transformation
  return cleaned.map(p => {
    if (!p) return '';
    
    let result = p;
    // If it's a 10 digit number and we have a dominant prefix like +1
    if (!p.startsWith('+') && p.length === 10 && dominantPrefix === '+1') {
      result = `+1${p}`;
    } else if (!p.startsWith('+') && p.length > 0) {
      // If no plus, but it's not the dominant pattern, we just prepend + if it's missing
      // But user specifically said "take country code from others"
      // So if dominant is +44 and this is 10 digits, we'd prepend +44
      if (p.length <= 10) {
        // Prepend dominant prefix if it's short
        result = `${dominantPrefix}${p}`;
      } else {
        // If it's already long, just add a + if missing (assuming it has a code already)
        result = `+${p}`;
      }
    }

    // 5. Final Pretty Formatting (Standard E.164-ish with spaces for readability)
    const digitsOnly = result.replace(/\D/g, '');
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+1 ${digitsOnly.slice(1, 4)}-${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }
    return result.startsWith('+') ? result : `+${result}`;
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
        
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
        if (!rawData || rawData.length === 0) {
          throw new Error("No data found in the Excel sheet.");
        }

        // Extract raw phone strings
        const rawPhones = rawData.map(row =>
          String(row['Phone Number'] || row['phone number'] || row['Phone'] || row['phone'] || row['Tel'] || '')
        ).filter(p => p.trim() !== '');

        // Normalize phones based on batch analysis
        const normalizedPhones = normalizePhoneNumbers(rawPhones);
        
        // Process mapping
        const leads = await chunkedMap(rawData, (row, i) => {
          const rawPhone = String(row['Phone Number'] || row['phone number'] || row['Phone'] || row['phone'] || row['Tel'] || '');
          if (!rawPhone.trim()) return null;

          // Find the index of this phone in the original filtered list to get its normalized version
          // Since we filtered rawPhones earlier, we should be careful. 
          // Better: use the original index.
          return {
            name: String(row['Name'] || row['name'] || row['First Name'] || row['Company'] || 'Unknown'),
            phoneNumber: normalizedPhones[i] || rawPhone,
            googleMapsUrl: row['Google Maps URL'] || row['google maps url'] || row['Map URL'] || row['maps url'] || '',
            hasWebsite: row['Has Website'] || row['has website'] || row['Website'] || row['website'] ? 'Yes' : 'No',
            notes: row['Notes'] || row['notes'] || '',
          };
        });

        // Filter out nulls (empty rows)
        const validLeads = (leads.filter(l => l !== null) as Omit<Lead, 'id' | 'status' | 'listId'>[])
          .filter(l => l.phoneNumber && l.phoneNumber.trim() !== '');
        
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
