import { create } from 'zustand';

export type DialerStateStatus = 'IDLE' | 'DIALING' | 'IN_CALL' | 'DISPOSITION' | 'PAUSED';

interface DialerState {
  status: DialerStateStatus;
  activeLeadId: string | null;
  callTimer: number; // in seconds
  queue: string[]; // List of lead IDs left to call
  delaySeconds: number; // Configurable delay between calls

  setStatus: (status: DialerStateStatus) => void;
  setActiveLead: (id: string | null) => void;
  setQueue: (queue: string[]) => void;
  popQueue: () => string | undefined;
  incrementTimer: () => void;
  resetTimer: () => void;
  setDelaySeconds: (seconds: number) => void;
  clearQueue: () => void;
}

export const useDialerStore = create<DialerState>((set, get) => ({
  status: 'IDLE',
  activeLeadId: null,
  callTimer: 0,
  queue: [],
  delaySeconds: 10, // Default 10 second delay

  setStatus: (status) => set({ status }),
  setActiveLead: (id) => set({ activeLeadId: id }),
  setQueue: (queue) => set({ queue }),
  popQueue: () => {
    const queue = get().queue;
    if (queue.length === 0) return undefined;
    const nextId = queue[0];
    set({ queue: queue.slice(1) });
    return nextId;
  },
  incrementTimer: () => set((state) => ({ callTimer: state.callTimer + 1 })),
  resetTimer: () => set({ callTimer: 0 }),
  setDelaySeconds: (seconds) => set({ delaySeconds: seconds }),
  clearQueue: () => set({ queue: [], status: 'IDLE', activeLeadId: null, callTimer: 0 }),
}));
