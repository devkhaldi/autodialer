import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  googleMapsUrl: string;
  hasWebsite: string;
  timezone: string;
  niche: string;
  notes: string;
  status: 'Uncalled' | 'Called' | 'Interested' | 'Callback Requested' | 'Failed' | 'DNC' | 'No Answer' | 'Wrong Number' | 'Busy' | 'Answering Machine' | 'Successful Sale' | 'Not Interested';
  [key: string]: any;
}

interface LeadState {
  leads: Lead[];
  loading: boolean;
  setLeads: (leads: Lead[]) => void;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'status'>) => Promise<void>;
  addLeads: (leads: Omit<Lead, 'id' | 'status'>[]) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status'], newNotes?: string) => Promise<void>;
  clearLeads: () => Promise<void>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,

  setLeads: (leads) => set({ leads }),

  /** Fetch all leads from Supabase */
  fetchLeads: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      set({ leads: data as Lead[] });
    }
    set({ loading: false });
  },

  /** Insert a single lead into Supabase */
  addLead: async (lead) => {
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...lead, status: 'Uncalled' }])
      .select()
      .single();
    if (!error && data) {
      set((state) => ({ leads: [...state.leads, data as Lead] }));
    }
  },

  /** Bulk insert leads (e.g. from XLSX) into Supabase */
  addLeads: async (leadsInput) => {
    const rows = leadsInput.map(l => ({ ...l, status: 'Uncalled' }));
    const { data, error } = await supabase
      .from('leads')
      .insert(rows)
      .select();
    if (!error && data) {
      set((state) => ({ leads: [...state.leads, ...(data as Lead[])] }));
    }
  },

  /** Update status and notes for a lead */
  updateLeadStatus: async (id, status, newNotes) => {
    const existing = get().leads.find(l => l.id === id);
    const updatedNotes = newNotes
      ? existing?.notes ? `${existing.notes}\n---\n${newNotes}` : newNotes
      : existing?.notes || '';

    const { data, error } = await supabase
      .from('leads')
      .update({ status, notes: updatedNotes })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        leads: state.leads.map(l => l.id === id ? (data as Lead) : l),
      }));
    }
  },

  /** Delete all leads from Supabase */
  clearLeads: async () => {
    await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    set({ leads: [] });
  },
}));
