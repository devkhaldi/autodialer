import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Lead {
  id: string;
  name: string;
  phoneNumber: string;
  googleMapsUrl: string;
  hasWebsite: string;
  notes: string;
  listId: string; // The ID of the list/campaign this lead belongs to
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
  
  setActiveList: (id: string | null) => void;
  addLeadsToList: (listName: string, leadsInput: Omit<Lead, 'id' | 'status' | 'listId'>[]) => void;
  addLeadsToExistingList: (listId: string, leadsInput: Omit<Lead, 'id' | 'status' | 'listId'>[]) => void;
  updateLeadStatus: (id: string, status: Lead['status'], newNotes?: string) => void;
  deleteList: (listId: string) => void;
  clearAll: () => void;
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      leads: [],
      lists: [],
      activeListId: null,
      loading: false,

      setActiveList: (id) => set({ activeListId: id }),

      /** Creates a new list and adds leads to it */
      addLeadsToList: (listName, leadsInput) => {
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

        set((state) => ({
          lists: [...state.lists, newList],
          leads: [...state.leads, ...newLeads],
          activeListId: state.activeListId || listId, // Auto-select if none selected
        }));
      },

      /** Adds leads to an already established list */
      addLeadsToExistingList: (listId, leadsInput) => {
        const newLeads: Lead[] = leadsInput.map((l) => ({
          ...l,
          id: getUuid(),
          listId: listId,
          status: 'Uncalled' as const,
        } as Lead));

        set((state) => ({
          leads: [...state.leads, ...newLeads],
        }));
      },

      /** Update status and append notes for a lead */
      updateLeadStatus: (id, status, newNotes) =>
        set((state) => ({
          leads: state.leads.map((lead) => {
            if (lead.id !== id) return lead;
            const updatedNotes = newNotes
              ? lead.notes
                ? `${lead.notes}\n---\n${newNotes}`
                : newNotes
              : lead.notes;
            return { ...lead, status, notes: updatedNotes };
          }),
        })),

      /** Deletes a specific list and all its leads */
      deleteList: (listId) =>
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
          leads: state.leads.filter((l) => l.listId !== listId),
          activeListId: state.activeListId === listId ? (state.lists.length > 1 ? state.lists.find(l => l.id !== listId)?.id || null : null) : state.activeListId,
        })),

      /** Clear everything */
      clearAll: () => set({ leads: [], lists: [], activeListId: null }),
    }),
    {
      name: 'autodialer-storage',
    }
  )
);
