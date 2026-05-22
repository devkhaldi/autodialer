"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore, Lead } from '@/store/leadStore';
import { initSipClient, startCall, hangupCall, stopSipClient } from '@/lib/sipClient';
import { triggerZadarmaCall } from '@/lib/zadarmaService';
import { Button } from './ui/Button';
import { Phone, Play, Square, SkipForward, Check, PhoneCall, Zap, AlertCircle, Loader2, ListTodo, Navigation, Clock } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';

export function DialerWidget() {
  const { 
    isDialing, currentLead, callQueue, queueIndex, timer, acwTimer, dialerStatus,
    startDialing, stopDialing, nextLead, setReady, enterACW, getNextLead,
    incrementTimer, incrementACWTimer, resetTimer, clearQueue,
    autoCall, callerNumber
  } = useDialerStore();
  
  const { leads, activeListId, lists, setActiveList, updateLeadStatus } = useLeadStore();
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isNextCopied, setIsNextCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [callError, setCallError] = useState('');
  const [useCallbackMode, setUseCallbackMode] = useState(true);
  const [webrtcError, setWebrtcError] = useState('Initializing WebRTC...');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCallTriggered = useRef(false);

  useEffect(() => {
    if (isDialing) {
      timerRef.current = setInterval(() => {
        if (dialerStatus === 'calling') {
          incrementTimer();
        } else if (dialerStatus === 'acw') {
          incrementACWTimer();
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDialing, dialerStatus, incrementTimer, incrementACWTimer]);

  useEffect(() => {
    const sipLogin = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN;
    const sipPassword = process.env.NEXT_PUBLIC_ZADARMA_SIP_PASSWORD;
    if (sipLogin && sipPassword) {
      initSipClient(sipLogin, sipPassword)
        .then(() => {
          setUseCallbackMode(false);
          setWebrtcError('');
        })
        .catch(err => {
          console.error("[DialerWidget] SIP Init Error:", err);
          setUseCallbackMode(true);
          setWebrtcError('WebRTC Blocked: Using Callback Fallback');
        });
    } else {
      setUseCallbackMode(true);
    }
    return () => {
      stopSipClient();
    };
  }, []);

  const handleAutoCall = useCallback(async () => {
    if (!currentLead?.phoneNumber) return;
    if (autoCallTriggered.current) return;
    
    autoCallTriggered.current = true;
    setCallStatus('connecting');
    setCallError('');
    
    try {
      if (useCallbackMode) {
         const activeCaller = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN || callerNumber;
         const result = await triggerZadarmaCall(activeCaller, currentLead.phoneNumber);
         if (!result.success) throw new Error(result.error || 'Server Callback Failed');
         setCallStatus('active');
      } else {
         await startCall(currentLead.phoneNumber, () => {
           setCallStatus('idle');
         });
         setCallStatus('active');
      }
    } catch (err: any) {
      setCallStatus('error');
      setCallError(err.message || 'Call failed');
    }
  }, [currentLead, useCallbackMode, callerNumber]);

  useEffect(() => {
    if (dialerStatus === 'calling' && currentLead && autoCall) {
      autoCallTriggered.current = false;
      handleAutoCall();
    }
    if (dialerStatus !== 'calling') {
      setCallStatus('idle');
      autoCallTriggered.current = false;
    }
  }, [dialerStatus, currentLead, autoCall, handleAutoCall]);

  const handleClickToCall = () => {
    if (!currentLead?.phoneNumber) return;
    autoCallTriggered.current = false;
    handleAutoCall();
  };

  useEffect(() => {
    if (currentLead) {
      setLocalNotes(currentLead.notes || '');
    }
  }, [currentLead]);

  const handleStartDialing = () => {
    setError('');
    const uncalledLeads = leads.filter(l => l.status === 'Uncalled' && l.listId === activeListId);
    if (uncalledLeads.length === 0) {
      setError("No 'Uncalled' leads available in this list.");
      return;
    }
    startDialing(uncalledLeads);
  };

  const handleStatusUpdate = async (status: Lead['status']) => {
    if (!currentLead) return;
    await updateLeadStatus(currentLead.id, status, localNotes);
    setLastSaved(new Date().toLocaleTimeString());
    enterACW();
  };

  const copyLeadLink = () => {
    if (!currentLead?.googleMapsUrl) return;
    navigator.clipboard.writeText(currentLead.googleMapsUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyNextLeadLink = () => {
    const next = getNextLead();
    if (!next?.googleMapsUrl) return;
    navigator.clipboard.writeText(next.googleMapsUrl);
    setIsNextCopied(true);
    setTimeout(() => setIsNextCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const DispositionBtn = ({ status, label, colors }: { status: Lead['status']; label: string; colors: string }) => (
    <button 
      onClick={() => handleStatusUpdate(status)} 
      className={`group flex items-center justify-center p-3 h-[60px] rounded-[10px] bg-white border border-[#e2e8f0] transition-all duration-200 shadow-sm hover:shadow-md ${colors}`}
    >
      <span className="font-semibold text-[13px] tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] w-full">
      {/* Dialer Settings Bar */}
      <div className="p-4 px-6 border-b border-[#e2e8f0] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-[13px] text-[#64748b] font-medium">
            <ListTodo className="h-4 w-4 mr-2" />
            Active List
          </div>
          <select 
            className="bg-white border text-[13px] border-[#cbd5e1] rounded-md px-3 py-1.5 text-[#0f172a] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] outline-none min-w-[200px]"
            value={activeListId || ''}
            onChange={(e) => setActiveList(e.target.value)}
            disabled={isDialing}
          >
            {lists.map((list, idx) => (
              <option key={`${list.id}-${idx}`} value={list.id}>{list.name}</option>
            ))}
            {lists.length === 0 && <option value="">No lists available</option>}
          </select>
          {autoCall && callerNumber && (
            <div className="flex items-center space-x-1.5 text-[12px] font-semibold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-md border border-[#10b981]/20">
              <Zap className="h-3.5 w-3.5" />
              <span>Auto-Dial ON</span>
            </div>
          )}
        </div>

        {isDialing && (
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-bold text-[#64748b] uppercase">Queue</span>
              <span className="text-[14px] font-bold text-[#0f172a] px-2 py-0.5 bg-[#f1f5f9] rounded-md border border-[#e2e8f0]">{queueIndex + 1} / {callQueue.length}</span>
            </div>
          </div>
        )}
      </div>

      {!isDialing ? (
        /* IDLE STATE */
        <div className="flex-1 flex items-center justify-center p-8 bg-dot-pattern">
           <Card className="max-w-[420px] w-full p-10 text-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border-[#e2e8f0] rounded-[24px]">
              <div className="mx-auto w-[72px] h-[72px] bg-[#f3e8ff] text-[#7c3aed] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#e9d5ff]">
                 <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-[20px] font-bold text-[#0f172a] mb-2">Power Dialer Ready</h3>
              <p className="text-[14px] text-[#64748b] mb-8 leading-relaxed px-4">
                Verify your list selection and click start to begin your automated dialing session.
              </p>
              {activeListId ? (
                <div className="space-y-4">
                  <div className="bg-[#f8fafc] p-3 rounded-[10px] text-[13px] text-[#475569] flex justify-between items-center font-medium border border-[#e2e8f0]">
                    <span>Uncalled Leads Ready:</span>
                    <span className="font-bold text-[#0f172a] text-[15px]">{leads.filter(l => l.status === 'Uncalled' && l.listId === activeListId).length}</span>
                  </div>
                  {error && <p className="text-[13px] text-[#ef4444] font-medium">{error}</p>}
                  <Button onClick={handleStartDialing} size="lg" className="w-full text-[15px]">
                    <Play className="h-5 w-5 mr-2" /> Start Dialing Session
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-[13px] rounded-[10px] font-medium">Please upload and select a list first.</div>
              )}
           </Card>
        </div>
      ) : (
        /* ACTIVE DIALER */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
          {/* Main Interactions Workspace (Left) */}
          <div className="flex-[5] flex flex-col border-r border-[#e2e8f0] overflow-y-auto bg-white">
            {dialerStatus === 'calling' ? (
              <div className="flex-1 flex flex-col p-8 md:p-10 space-y-6 animate-in fade-in duration-300">
                
                {/* Status Badges Header */}
                <div className="flex items-center space-x-2">
                  <Badge className="bg-[#f5f3ff] text-[#7c3aed]  px-3 py-1 animate-pulse border border-[#e9d5ff]">ACTIVE CALL OUTBOUND</Badge>
                  {callStatus === 'connecting' && <Badge className="bg-amber-50 text-amber-600 border border-amber-200"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Connecting...</Badge>}
                  {callStatus === 'active' && <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200"><Zap className="h-3 w-3 mr-1" /> Zadarma Active</Badge>}
                  {callStatus === 'error' && <Badge className="bg-red-50 text-red-600 border border-red-200"><AlertCircle className="h-3 w-3 mr-1" /> {callError}</Badge>}
                </div>

                <div className="py-2">
                  <h2 className="text-[32px] md:text-[40px] font-bold text-[#0f172a] tracking-tight leading-tight mb-3">{currentLead?.name}</h2>
                  <div className="flex items-center text-[22px] md:text-[28px] text-[#475569] font-mono tracking-tighter font-semibold">
                    <Phone className="h-6 w-6 mr-3 text-[#cbd5e1]" /> {currentLead?.phoneNumber}
                  </div>
                </div>

                {/* Main Action Line */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-[16px] shadow-sm">
                  <Button
                    onClick={handleClickToCall}
                    className="w-full sm:w-auto h-[48px] px-8 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[15px] shadow-[0_2px_10px_rgba(124,58,237,0.2)] rounded-[10px]"
                  >
                    <PhoneCall className="h-5 w-5 mr-3" />
                    Dial Number Now
                  </Button>

                  <div className="flex flex-row w-full sm:w-auto gap-4 items-center">

                    
                    <Button 
                      onClick={copyLeadLink} 
                      variant="outline"
                      className={`h-[48px] px-6 rounded-[10px] font-semibold transition-colors flex-1 sm:flex-none ${isCopied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}`}
                    >
                      <Navigation className="w-4 h-4 mr-2 text-gray-400" />
                      {isCopied ? 'Map Link Copied!' : 'Copy Info Link'}
                    </Button>
                  </div>
                </div>

                {/* Disposition Grid section matching light theme sections */}
                <div className="mt-8 bg-[#fef2f2]/40 border border-[#fecaca] rounded-[16px] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-semibold text-[#0f172a] flex items-center">
                      <ListTodo className="h-4 w-4 mr-2 text-red-500" />
                      Log Outcome / Disposition
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Primary */}
                    <div>
                      <p className="text-[12px] font-semibold text-[#64748b] mb-2 uppercase tracking-wide">High Intent</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DispositionBtn status="Interested" label="Interested" colors="hover:border-[#10b981] hover:bg-[#10b981]/5 text-[#0f172a] hover:text-[#10b981]" />
                        <DispositionBtn status="Successful Sale" label="Successful Sale" colors="hover:border-[#3b82f6] hover:bg-[#3b82f6]/5 text-[#0f172a] hover:text-[#3b82f6]" />
                        <DispositionBtn status="Callback Requested" label="Callback Request" colors="hover:border-[#f59e0b] hover:bg-[#f59e0b]/5 text-[#0f172a] hover:text-[#f59e0b]" />
                        <DispositionBtn status="Busy" label="Busy" colors="hover:border-[#64748b] hover:bg-[#f8fafc] text-[#0f172a]" />
                      </div>
                    </div>
                    
                    {/* Secondary & New */}
                    <div>
                      <p className="text-[12px] font-semibold text-[#64748b] mb-2 uppercase tracking-wide">Unsuccessful & Others</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DispositionBtn status="Dead Air" label="Dead Air" colors="text-[#64748b] hover:bg-gray-50 hover:border-gray-300" />
                        <DispositionBtn status="No Answer" label="No Answer" colors="text-[#64748b] hover:bg-gray-50 hover:border-gray-300" />
                        <DispositionBtn status="Customer Hang Up" label="Cust. Hang Up" colors="text-[#ea580c] hover:bg-orange-50 hover:border-orange-200" />
                        <DispositionBtn status="Language Barrier" label="Language Barrier" colors="text-[#a855f7] hover:bg-purple-50 hover:border-purple-200" />
                        
                        <DispositionBtn status="Owner Not Available" label="Owner N/A" colors="text-[#0d9488] hover:bg-teal-50 hover:border-teal-200" />
                        <DispositionBtn status="Not Interested" label="Not Interested" colors="text-[#64748b] hover:bg-gray-50 hover:border-gray-300" />
                        <DispositionBtn status="Failed" label="Failed Connection" colors="text-[#ef4444] hover:bg-red-50 hover:border-red-200" />
                        <DispositionBtn status="DNC" label="DNC / Blocked" colors="bg-red-50 text-red-600 border-red-200 hover:bg-red-100" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex justify-between items-center border-t border-[#e2e8f0]">
                  <Button variant="ghost" onClick={() => { hangupCall(); stopDialing(); }} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium h-[40px]">
                    <Square className="h-4 w-4 mr-2" /> Stop Session & Hang Up
                  </Button>
                  <Button variant="secondary" onClick={nextLead} className="font-semibold text-[#0f172a] h-[40px] px-6">
                    Skip Contact <SkipForward className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              /* ACW STATE */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dot-pattern animate-in zoom-in-95 duration-300">
                 <div className="max-w-md w-full">
                   <div className="text-center mb-8">
                      <div className="inline-flex items-center text-[12px] font-bold text-[#7c3aed] bg-[#f3e8ff] px-3.5 py-1.5 rounded-full border border-[#e9d5ff] mb-4 uppercase tracking-widest">
                         <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wrap-Up Mode
                      </div>
                      <h2 className="text-[32px] font-bold text-[#0f172a] tracking-tight mb-2">Outcome Saved.</h2>
                      <p className="text-[15px] text-[#64748b]">Finish your notes before proceeding to the next prospect.</p>
                   </div>
  
                   <Card className="mb-6 p-1 border-[#e2e8f0]">
                     <div className="bg-[#f8fafc] rounded-[10px] p-6 flex flex-row justify-center">
                      <div className="text-center px-4">
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-1">Wrap-up Time</p>
                        <p className="text-[24px] font-mono font-bold text-[#0f172a]">{formatTime(acwTimer)}</p>
                      </div>
                     </div>
                   </Card>
  
                   {getNextLead() && (
                     <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-5 shadow-sm text-center mb-8 text-[#0f172a]">
                        <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-1">Up Next</p>
                        <h4 className="text-[18px] font-bold mb-4">{getNextLead()?.name}</h4>
                        <Button 
                          onClick={copyNextLeadLink} 
                          variant="outline"
                          className={`w-full font-semibold h-[40px] ${isNextCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}
                        >
                          {isNextCopied ? (
                            <span className="flex items-center"><Check className="h-4 w-4 mr-2" /> Next Map Link Copied!</span>
                          ) : (
                            <span className="flex items-center">Research Next Candidate</span>
                          )}
                        </Button>
                     </div>
                   )}
  
                   <Button 
                     onClick={setReady} 
                     className="w-full h-[56px] text-[16px] font-bold bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-md rounded-[12px] mb-4"
                   >
                     START NEXT CALL
                   </Button>
                   <div className="text-center">
                     <button onClick={stopDialing} className="text-[#64748b] hover:text-[#ef4444] text-[13px] font-semibold transition-colors">
                       Finish dialing session completely
                     </button>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Notes Panel (Right side) */}
          <div className="flex-[3] flex flex-col p-6 bg-[#f8fafc] border-l border-[#e2e8f0] max-w-[400px]">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-[#0f172a] flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Internal Notes
                </h3>
                <div className="flex items-center space-x-1.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${dialerStatus === 'calling' ? 'bg-[#ef4444] animate-pulse' : 'bg-[#10b981]'}`} />
                   <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide">Syncing</span>
                </div>
             </div>
             
             <textarea
               className="flex-1 w-full p-4 bg-white rounded-[12px] border border-[#e2e8f0] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] text-[#0f172a] text-[14px] leading-relaxed placeholder:text-[#94a3b8] transition-shadow shadow-sm outline-none resize-none font-medium"
               placeholder="Type your notes during the call... (Saved automatically upon outcome selection)"
               value={localNotes}
               onChange={(e) => setLocalNotes(e.target.value)}
             />
             
             <div className="mt-4 p-4 bg-white rounded-[12px] border border-[#e2e8f0] shadow-sm">
                <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wide mb-3">CRM Data Overview</p>
                <div className="space-y-2.5">
                   <div className="flex justify-between items-center bg-[#f8fafc] p-2 px-3 rounded-lg border border-[#e2e8f0] border-dashed">
                     <span className="text-[12px] font-semibold text-[#475569]">Call Stage</span>
                     <span className="text-[12px] font-bold text-[#0f172a] uppercase tracking-tight">{dialerStatus}</span>
                   </div>
                   <div className="flex justify-between items-center bg-[#f8fafc] p-2 px-3 rounded-lg border border-[#e2e8f0] border-dashed">
                     <span className="text-[12px] font-semibold text-[#475569]">Website</span>
                     <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${currentLead?.hasWebsite !== 'N/A' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                        {currentLead?.hasWebsite !== 'N/A' ? 'ACTIVE' : 'MISSING'}
                     </span>
                   </div>
                   {autoCall && (
                     <div className="flex justify-between items-center bg-[#f8fafc] p-2 px-3 rounded-lg border border-[#e2e8f0] border-dashed">
                       <span className="text-[12px] font-semibold text-[#475569]">Zadarma</span>
                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${callStatus === 'active' ? 'bg-[#dcfce7] text-[#166534]' : callStatus === 'connecting' ? 'bg-[#fef3c7] text-[#92400e]' : callStatus === 'error' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#e2e8f0] text-[#475569]'}`}>
                         {callStatus === 'active' ? 'CONN' : callStatus === 'connecting' ? 'DIALING...' : callStatus === 'error' ? 'ERR' : 'IDLE'}
                       </span>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
