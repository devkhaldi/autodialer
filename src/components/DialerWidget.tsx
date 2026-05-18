"use client";

import { useEffect, useRef, useState } from 'react';
import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore } from '@/store/leadStore';
import { initSipClient, startCall, hangupCall } from '@/lib/sipClient';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Phone, PhoneOff, Play, Square } from 'lucide-react';

export function DialerWidget() {
  const { 
    status, activeLeadId, callTimer, queue, 
    setStatus, setActiveLead, popQueue, 
    incrementTimer, resetTimer, clearQueue, delaySeconds 
  } = useDialerStore();
  
  const { leads } = useLeadStore();
  const [error, setError] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentLead = leads.find(l => l.id === activeLeadId);

  useEffect(() => {
    let delayMounter: NodeJS.Timeout;
    
    if (status === 'DIALING' && currentLead) {
      const initAndCall = async () => {
        try {
          if (!process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || !process.env.NEXT_PUBLIC_ZADARMA_SIP_PASSWORD) {
             throw new Error("Missing SIP Credentials in Environment Variables.");
          }
          await initSipClient(process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN, process.env.NEXT_PUBLIC_ZADARMA_SIP_PASSWORD);
          await startCall(currentLead.phoneNumber, () => {
            clearInterval(timerRef.current!);
            setStatus('DISPOSITION');
          });
          setStatus('IN_CALL');
          resetTimer();
          timerRef.current = setInterval(() => incrementTimer(), 1000);
        } catch (err: any) {
          setError(err.message || "Failed to establish call.");
          setStatus('DISPOSITION');
        }
      };
      
      delayMounter = setTimeout(() => {
         initAndCall();
      }, delaySeconds * 1000);
    }
    
    return () => clearTimeout(delayMounter);
  }, [status, currentLead, delaySeconds, setStatus, resetTimer, incrementTimer]);

  const handleStartDialing = () => {
    setError('');
    const uncalledLeads = leads.filter(l => l.status === 'Uncalled');
    if (uncalledLeads.length === 0) {
      setError("No 'Uncalled' leads available in list.");
      return;
    }
    
    useDialerStore.getState().setQueue(uncalledLeads.map(l => l.id));
    const firstLead = useDialerStore.getState().popQueue();
    setActiveLead(firstLead!);
    setStatus('DIALING');
  };

  const handleHangup = async () => {
    await hangupCall();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('DISPOSITION');
  };

  const handleStopSession = async () => {
    if (status === 'IN_CALL' || status === 'DIALING') {
      await hangupCall();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    clearQueue();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="flex flex-col items-center">
          {status === 'IDLE' && (
            <div className="text-center space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Power Dialer Ready</h3>
              <p className="text-sm text-gray-500">You have <span className="font-semibold text-gray-700">{leads.filter(l => l.status === 'Uncalled').length}</span> uncalled leads loaded.</p>
              {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-lg p-3">{error}</p>}
              <Button onClick={handleStartDialing} size="lg" className="w-full justify-center space-x-2 mt-4">
                <Play className="h-4 w-4 mr-2" />
                Start Auto Dialing
              </Button>
            </div>
          )}

          {(status === 'DIALING' || status === 'IN_CALL') && currentLead && (
            <div className="w-full text-center space-y-4">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2 ${status === 'IN_CALL' ? 'bg-green-50' : 'bg-amber-50'}`}>
                <Phone className={`h-9 w-9 ${status === 'IN_CALL' ? 'text-green-600' : 'text-amber-500 animate-pulse'}`} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{currentLead.name}</h3>
              <p className="text-lg text-gray-500">{currentLead.phoneNumber}</p>
              
              {status === 'IN_CALL' ? (
                <div className="text-green-600 font-mono text-3xl font-bold mt-4">
                  {formatTimer(callTimer)}
                </div>
              ) : (
                <div className="text-amber-500 mt-4 text-sm font-semibold animate-pulse">
                  Dialing...
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button variant="destructive" size="lg" className="rounded-full w-16 h-16 flex items-center justify-center p-0" onClick={handleHangup}>
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          
          {status === 'DISPOSITION' && currentLead && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-2">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-amber-600">Call Ended</h3>
              <p className="text-sm text-gray-500">Awaiting disposition for <span className="font-medium text-gray-700">{currentLead.name}</span>...</p>
            </div>
          )}

          {status !== 'IDLE' && (
            <div className="mt-8 pt-6 border-t border-gray-100 w-full flex justify-center">
              <Button variant="ghost" onClick={handleStopSession} className="text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm">
                <Square className="h-4 w-4 mr-2" />
                Stop session & Reset Queue
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
