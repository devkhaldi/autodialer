import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead } from './leadStore';

interface DialerState {
  isDialing: boolean;
  dialerStatus: 'idle' | 'calling' | 'acw';
  currentLead: Lead | null;
  callQueue: Lead[];
  queueIndex: number;
  timer: number;
  acwTimer: number;
  callbackMode: boolean;
  setCallbackMode: (val: boolean) => void;
  delaySeconds: number;
  setDelaySeconds: (val: number) => void;
  autoCall: boolean;
  setAutoCall: (val: boolean) => void;
  callerNumber: string;
  setCallerNumber: (val: string) => void;
  
  startDialing: (leads: Lead[]) => void;
  stopDialing: () => void;
  nextLead: () => void;
  setReady: () => void;
  enterACW: () => void;
  incrementTimer: () => void;
  incrementACWTimer: () => void;
  resetTimer: () => void;
  clearQueue: () => void;
  getNextLead: () => Lead | null;
  startSingleCall: (lead: Lead) => void;
}

export const useDialerStore = create<DialerState>()(
  persist(
    (set, get) => ({
      isDialing: false,
      dialerStatus: 'idle',
      currentLead: null,
      callQueue: [],
      queueIndex: 0,
      timer: 0,
      acwTimer: 0,
      callbackMode: false,
      setCallbackMode: (val: boolean) => set({ callbackMode: val }),
      delaySeconds: 3,
      setDelaySeconds: (val: number) => set({ delaySeconds: val }),
      autoCall: false,
      setAutoCall: (val: boolean) => set({ autoCall: val }),
      callerNumber: process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || '',
      setCallerNumber: (val: string) => set({ callerNumber: val }),

      startDialing: (leads: Lead[]) => {
        if (leads.length === 0) return;
        set({
          isDialing: true,
          dialerStatus: 'calling',
          callQueue: leads,
          queueIndex: 0,
          currentLead: leads[0],
          timer: 0,
          acwTimer: 0
        });
      },

      stopDialing: () => {
        set({
          isDialing: false,
          dialerStatus: 'idle',
          currentLead: null,
          callQueue: [],
          queueIndex: 0,
          timer: 0,
          acwTimer: 0
        });
      },

      nextLead: () => {
        const { queueIndex, callQueue } = get();
        const nextIndex = queueIndex + 1;
        
        if (nextIndex < callQueue.length) {
          set({
            queueIndex: nextIndex,
            currentLead: callQueue[nextIndex],
            timer: 0,
            acwTimer: 0,
            dialerStatus: 'calling'
          });
        } else {
          get().stopDialing();
        }
      },

      setReady: () => {
        if (get().dialerStatus === 'acw') {
          get().nextLead();
        }
      },

      enterACW: () => {
        set({ dialerStatus: 'acw', acwTimer: 0 });
      },

      incrementTimer: () => set((state) => ({ timer: state.timer + 1 })),
      incrementACWTimer: () => set((state) => ({ acwTimer: state.acwTimer + 1 })),
      resetTimer: () => set({ timer: 0 }),
      clearQueue: () => get().stopDialing(),
      getNextLead: () => {
        const { queueIndex, callQueue } = get();
        const nextIndex = queueIndex + 1;
        return nextIndex < callQueue.length ? callQueue[nextIndex] : null;
      },
      startSingleCall: (lead: Lead) => {
        set({
          isDialing: true,
          dialerStatus: 'calling',
          callQueue: [lead],
          queueIndex: 0,
          currentLead: lead,
          timer: 0,
          acwTimer: 0
        });
      },
    }),
    {
      name: 'dialer-storage',
      //@ts-ignore
      partialize: (state) => ({ 
        callbackMode: state.callbackMode,
        delaySeconds: state.delaySeconds,
        autoCall: state.autoCall,
        callerNumber: state.callerNumber,
      }),
    }
  )
);
