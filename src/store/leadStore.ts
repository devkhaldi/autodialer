import { create } from 'zustand';

export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  googleMapsUrl: string;
  hasWebsite: string;
  notes: string;
  listId: string;
  status: 'Uncalled' | 'Called' | 'Interested' | 'Callback Requested' | 'Failed' | 'DNC' | 'No Answer' | 'Wrong Number' | 'Busy' | 'Answering Machine' | 'Successful Sale' | 'Not Interested';
  [key: string]: any;
}

export interface LeadList {
  id: string;
  name: string;
  createdAt: number;
}

const getUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface LeadState {
  leads: Lead[];
  lists: LeadList[];
  activeListId: string | null;
  loading: boolean;
  
  fetchLeads: () => Promise<void>;
  setActiveList: (id: string | null) => void;
  addLeadsToList: (listName: string, leadsInput: Omit<Lead, 'id' | 'status' | 'listId'>[]) => Promise<void>;
  addLeadsToExistingList: (listId: string, leadsInput: Omit<Lead, 'id' | 'status' | 'listId'>[]) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status'], newNotes?: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  lists: [],
  activeListId: null,
  loading: false,

  fetchLeads: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.lists) {
        set({ 
          lists: data.lists, 
          leads: data.leads, 
          activeListId: data.lists.length > 0 ? (get().activeListId || data.lists[0].id) : null 
        });
      }
    } catch (err) {
      console.error("Failed to fetch leads from server:", err);
    } finally {
      set({ loading: false });
    }
  },

  setActiveList: (id) => set({ activeListId: id }),

  addLeadsToList: async (listName, leadsInput) => {
    const listId = getUuid();
    const newList: LeadList = {
      id: listId,
      name: listName,
      createdAt: Date.now(),
    };

    const newLeads: Lead[] = leadsInput.map((l) => ({
      ...l,
      id: getUuid(),
      listId: listId,
      status: 'Uncalled' as const,
    } as Lead));

    // Update local state first
    set((state) => ({
      lists: [...state.lists, newList],
      leads: [...state.leads, ...newLeads],
      activeListId: listId,
    }));

    // Sync with server
    await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify({ list: newList, leads: newLeads }),
    });
  },

  addLeadsToExistingList: async (listId, leadsInput) => {
    const list = get().lists.find(l => l.id === listId);
    if (!list) return;

    const newLeads: Lead[] = leadsInput.map((l) => ({
      ...l,
      id: getUuid(),
      listId: listId,
      status: 'Uncalled' as const,
    } as Lead));

    const updatedLeads = [...get().leads, ...newLeads];

    set({ leads: updatedLeads });

    // Sync full list data with server
    await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify({ 
        list, 
        leads: updatedLeads.filter(l => l.listId === listId) 
      }),
    });
  },

  updateLeadStatus: async (id, status, newNotes) => {
    let affectedListId: string | null = null;

    set((state) => {
      const updatedLeads = state.leads.map((lead) => {
        if (lead.id !== id) return lead;
        affectedListId = lead.listId;
        const updatedNotes = newNotes
          ? lead.notes ? `${lead.notes}\n---\n${newNotes}` : newNotes
          : lead.notes;
        return { ...lead, status, notes: updatedNotes };
      });
      return { leads: updatedLeads };
    });

    if (affectedListId) {
      const list = get().lists.find(l => l.id === affectedListId);
      const filteredLeads = get().leads.filter(l => l.listId === affectedListId);
      await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify({ list, leads: filteredLeads }),
      });
    }
  },

  deleteList: async (listId) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
      leads: state.leads.filter((l) => l.listId !== listId),
      activeListId: state.activeListId === listId ? (state.lists.length > 1 ? state.lists.find(l => l.id !== listId)?.id || null : null) : state.activeListId,
    }));

    await fetch(`/api/leads?id=${listId}`, { method: 'DELETE' });
  },

  clearAll: async () => {
    const { lists } = get();
    for (const list of lists) {
      await fetch(`/api/leads?id=${list.id}`, { method: 'DELETE' });
    }
    set({ leads: [], lists: [], activeListId: null });
  },
}));
