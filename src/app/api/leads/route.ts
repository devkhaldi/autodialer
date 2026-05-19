import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';

const UPLOAD_DIR = path.join(process.cwd(), 'src/data/uploads');

// Ensure the directory exists
async function ensureDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Loads all leads from all XLSX files in the uploads directory.
 */
export async function GET() {
  await ensureDir();
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const lists: any[] = [];
    let allLeads: any[] = [];

    for (const file of files) {
      if (file.endsWith('.xlsx')) {
        const filePath = path.join(UPLOAD_DIR, file);
        const buffer = await fs.readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any>(worksheet);

        // Metadata is encoded in filename for now: CampaignName__ID.xlsx
        const [cName, listId] = file.replace('.xlsx', '').split('___');
        
        // Deduplicate lists so each ID appears only once
        if (!lists.find((l: any) => l.id === listId)) {
          lists.push({ id: listId, name: cName.replace(/_/g, ' '), createdAt: Date.now() });
        }
        
        const leads = data.map(row => ({
          ...row,
          listId: listId,
          // Map XLSX columns back to our Lead interface if they match
          id: row.__id,
          name: row.Name,
          phoneNumber: row['Phone Number'],
          googleMapsUrl: row['Google Maps URL'],
          hasWebsite: row['Has Website'],
          status: row.Status || 'Uncalled',
          notes: row.Notes || '',
          updatedAt: row['Updated At'] || ''
        }));
        
        allLeads = [...allLeads, ...leads];
      }
    }

    return NextResponse.json({ lists, leads: allLeads });
  } catch (error) {
    console.error("GET Leads error:", error);
    return NextResponse.json({ error: 'Failed to load XLSX data' }, { status: 500 });
  }
}

/**
 * Saves or updates an XLSX file.
 */
export async function POST(request: Request) {
  await ensureDir();
  try {
    const { list, leads } = await request.json();
    if (!list || !list.id) return NextResponse.json({ error: 'Invalid list' }, { status: 400 });

    const safeName = list.name.replace(/\s+/g, '_').replace(/[^\w]/g, '');
    const filename = `${safeName}___${list.id}.xlsx`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Prepare data for XLSX
    const xlsxData = leads.map((l: any) => ({
      __id: l.id,
      Name: l.name,
      'Phone Number': l.phoneNumber,
      'Google Maps URL': l.googleMapsUrl,
      'Has Website': l.hasWebsite,
      Status: l.status,
      Notes: l.notes,
      'Updated At': l.updatedAt || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(xlsxData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Leads error:", error);
    return NextResponse.json({ error: 'Failed to save XLSX' }, { status: 500 });
  }
}

/**
 * Surgical update of a single lead status/notes in the XLSX.
 */
export async function PATCH(request: Request) {
  await ensureDir();
  try {
    const { listId, leadId, status, notes, updatedAt } = await request.json();
    if (!listId || !leadId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

    const files = await fs.readdir(UPLOAD_DIR);
    const targetFile = files.find(f => f.includes(`___${listId}.xlsx`));
    if (!targetFile) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const filePath = path.join(UPLOAD_DIR, targetFile);
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);

    // Find and update the row
    const rowIndex = data.findIndex(row => row.__id === leadId);
    if (rowIndex === -1) return NextResponse.json({ error: 'Lead not found in file' }, { status: 404 });

    data[rowIndex].Status = status;
    data[rowIndex].Notes = notes;
    data[rowIndex]['Updated At'] = updatedAt;

    // Write back
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Leads");
    
    const newBuffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
    await fs.writeFile(filePath, newBuffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Lead error:", error);
    return NextResponse.json({ error: 'Failed to update lead in XLSX' }, { status: 500 });
  }
}

/**
 * Deletes an XLSX file.
 */
export async function DELETE(request: Request) {
  await ensureDir();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const files = await fs.readdir(UPLOAD_DIR);
    const targetFile = files.find(f => f.includes(`___${id}.xlsx`));
    
    if (targetFile) {
      await fs.unlink(path.join(UPLOAD_DIR, targetFile));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
