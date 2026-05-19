import { create } from 'zustand';
import { Lead } from './leadStore';

interface DialerState {
  isDialing: boolean;
  currentLead: Lead | null;
  callQueue: Lead[];
  queueIndex: number;
  timer: number;
  
  startDialing: (leads: Lead[]) => void;
  stopDialing: () => void;
  nextLead: () => void;
  incrementTimer: () => void;
  resetTimer: () => void;
  clearQueue: () => void;
}

export const useDialerStore = create<DialerState>((set, get) => ({
  isDialing: false,
  currentLead: null,
  callQueue: [],
  queueIndex: 0,
  timer: 0,

  startDialing: (leads: Lead[]) => {
    if (leads.length === 0) return;
    set({
      isDialing: true,
      callQueue: leads,
      queueIndex: 0,
      currentLead: leads[0],
      timer: 0
    });
  },

  stopDialing: () => {
    set({
      isDialing: false,
      currentLead: null,
      callQueue: [],
      queueIndex: 0,
      timer: 0
    });
  },

  nextLead: () => {
    const { queueIndex, callQueue } = get();
    const nextIndex = queueIndex + 1;
    
    if (nextIndex < callQueue.length) {
      set({
        queueIndex: nextIndex,
        currentLead: callQueue[nextIndex],
        timer: 0
      });
    } else {
      set({
        isDialing: false,
        currentLead: null,
        callQueue: [],
        queueIndex: 0,
        timer: 0
      });
    }
  },

  incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
  resetTimer: () => set({ timer: 0 }),
  clearQueue: () => set({ isDialing: false, currentLead: null, callQueue: [], queueIndex: 0, timer: 0 }),
}));
