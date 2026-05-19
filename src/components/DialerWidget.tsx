"use client";

import { useState, useEffect, useRef } from 'react';
import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Button } from './ui/Button';
import { Phone, Play, Square, SkipForward, MapPin, ExternalLink, ListFilter, Check, AlertTriangle, Smartphone, AlertCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { Switch } from './ui/Switch';
import { initSipClient, startCall, hangupCall, stopSipClient } from '@/lib/sipClient';

export function DialerWidget() {
  const { 
    isDialing, currentLead, callQueue, queueIndex, timer, acwTimer, dialerStatus, callbackMode,
    startDialing, stopDialing, nextLead, setReady, enterACW, getNextLead,
    incrementTimer, incrementACWTimer, resetTimer, clearQueue, setCallbackMode 
  } = useDialerStore();
  
  const { leads, activeListId, lists, setActiveList, updateLeadStatus } = useLeadStore();
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isNextCopied, setIsNextCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [sipInitialized, setSipInitialized] = useState(false);
  const [sipError, setSipError] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SIP Client on Mount
  useEffect(() => {
    const sipLogin = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN;
    const sipPassword = process.env.NEXT_PUBLIC_ZADARMA_SIP_PASSWORD;

    if (sipLogin && sipPassword && !callbackMode) {
      initSipClient(sipLogin, sipPassword)
        .then(() => {
          setSipInitialized(true);
          setSipError(null);
        })
        .catch((err) => {
          console.error('SIP Init Error:', err);
          setSipError('WebRTC Blocked. Try Callback Mode.');
        });
    } else if (callbackMode) {
      setSipInitialized(true);
      setSipError(null);
    } else {
      setSipError('Credentials missing');
    }

    return () => {
      stopSipClient().catch(console.error);
    };
  }, [callbackMode]);

  useEffect(() => {
    if (callbackMode) {
      setError(''); // Clear errors when switching to callback mode
      setSipInitialized(true);
      setSipError(null);
    }
  }, [callbackMode]);

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

  // Ref to cancel in-flight callback requests
  const abortRef = useRef<AbortController | null>(null);
  const callingLeadRef = useRef<string | null>(null);

  useEffect(() => {
    // Cancel any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (dialerStatus === 'calling' && currentLead && sipInitialized) {
      // Guard: don't re-call the same lead
      if (callingLeadRef.current === currentLead.id) return;
      callingLeadRef.current = currentLead.id;

      if (callbackMode) {
        // Use Zadarma Callback API with timeout & cancellation
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const sipLogin = process.env.NEXT_PUBLIC_ZADARMA_SIP_LOGIN;
        fetch('/api/zadarma/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: sipLogin, to: currentLead.phoneNumber }),
          signal: controller.signal,
        })
        .then(res => res.json())
        .then(data => {
          clearTimeout(timeoutId);
          if (!data.success) {
            setError(`Callback Failed: ${data.error}`);
          }
        })
        .catch(err => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.log('[Dialer] Callback request cancelled');
          } else {
            console.error('Callback API Error:', err);
            setError('Callback API unreachable. Check connection.');
          }
        });
      } else {
        // Use Standard Browser WebRTC
        startCall(currentLead.phoneNumber, () => {
          enterACW();
        }).catch((err) => {
          console.error('Call Error:', err);
          setError(`Call Failed: ${err.message || 'Unknown Error'}`);
        });
      }
    } else if (dialerStatus === 'acw' || dialerStatus === 'idle') {
      callingLeadRef.current = null;
      if (!callbackMode) hangupCall().catch(console.error);
    }

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [dialerStatus, currentLead, sipInitialized, callbackMode]);

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
    
    // Update local state and XLSX via store with the current local notes
    await updateLeadStatus(currentLead.id, status, localNotes);
    setLastSaved(new Date().toLocaleTimeString());
    
    // Move to ACW instead of next lead
    enterACW();
  };

  const copyLeadInfo = () => {
    if (!currentLead) return;
    const info = `
Name: ${currentLead.name}
Phone: ${currentLead.phoneNumber}
${currentLead.googleMapsUrl ? `Maps: ${currentLead.googleMapsUrl}` : ''}
${Object.entries(currentLead)
  .filter(([k]) => !['id', 'name', 'phoneNumber', 'googleMapsUrl', 'listId', '__id'].includes(k))
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}
    `.trim();
    navigator.clipboard.writeText(info);
    alert("Lead info copied!");
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Dialer Header / Configuration */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
            <ListFilter className="h-4 w-4" />
            <span>Select List:</span>
          </div>
          <select 
            className="bg-white border border-gray-300 text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
            value={activeListId || ''}
            onChange={(e) => setActiveList(e.target.value)}
            disabled={isDialing}
          >
            {lists.map((list, idx) => (
              <option key={`${list.id}-${idx}`} value={list.id}>{list.name}</option>
            ))}
            {lists.length === 0 && <option value="">No lists available</option>}
          </select>
        </div>

        <div className="flex items-center space-x-3 bg-white/40 px-4 py-2 rounded-lg border border-white/50">
          <Smartphone size={16} className={callbackMode ? 'text-amber-600' : 'text-gray-400'} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter leading-none mb-1">Engine Mode</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{callbackMode ? 'Hybrid Callback' : 'WebRTC Direct'}</span>
              <Switch 
                checked={callbackMode} 
                onCheckedChange={setCallbackMode}
                disabled={isDialing && dialerStatus === 'calling'}
              />
            </div>
          </div>
        </div>

        {callbackMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/50 border border-amber-200/50 rounded-full animate-pulse">
            <AlertCircle size={12} className="text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Network Bypass Active</span>
          </div>
        )}

        {isDialing && (
          <div className="flex items-center space-x-6">
            <div className="text-sm font-medium text-gray-500">
              Queue: <span className="text-gray-900">{queueIndex + 1} / {callQueue.length}</span>
            </div>
            <div className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {formatTime(timer)}
            </div>
          </div>
        )}
      {/* SIP Status Bar */}
      {sipError && (
        <div className="bg-red-50 border-b border-red-100 flex items-center justify-center p-2 text-xs font-bold text-red-600 space-x-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{sipError}</span>
        </div>
      )}
      {!sipInitialized && !sipError && (
        <div className="bg-blue-50 border-b border-blue-100 flex items-center justify-center p-2 text-xs font-bold text-blue-600 animate-pulse">
          Connecting to Zadarma SIP Server...
        </div>
      )}
    </div>

      {!isDialing ? (
        <div className="flex-1 flex items-center justify-center p-8">
           <Card className="max-w-md w-full border-dashed border-2 shadow-none">
             <CardContent className="pt-10 pb-10 text-center space-y-4">
               <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Power Dialer Ready</h3>
               <p className="text-sm text-gray-500 px-6">
                 Select a campaign list above to start your automated calling session.
               </p>
               {activeListId ? (
                 <div className="pt-4 px-6">
                   <div className="bg-blue-50/50 p-3 rounded-lg mb-4 text-xs text-blue-700 flex justify-between items-center">
                     <span>Uncalled Leads:</span>
                     <span className="font-bold">{leads.filter(l => l.status === 'Uncalled' && l.listId === activeListId).length}</span>
                   </div>
                   {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
                   <Button onClick={handleStartDialing} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                     <Play className="h-4 w-4 mr-2" /> Start Dialing Session
                   </Button>
                 </div>
               ) : (
                 <p className="text-xs text-amber-600 font-medium">Please create a list first.</p>
               )}
             </CardContent>
           </Card>
        </div>
      ) : (
        /* IMMERSIVE FULL-BLEED DIALER */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white/40 backdrop-blur-xl border-t border-white/20">
          {/* Main Workspace (Left 60% / Top on Mobile) */}
          <div className="flex-[3] flex flex-col border-r border-gray-100 bg-gray-50/20 shadow-inner overflow-y-auto">
            {dialerStatus === 'calling' ? (
              <div className="flex-1 flex flex-col p-12 space-y-12 animate-in fade-in duration-500 overflow-y-auto">
                <div className="space-y-4">
                  <Badge className="bg-blue-600 text-white border-none px-4 py-1 animate-pulse">ACTIVE CALLING PHASE</Badge>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">{currentLead?.name}</h2>
                  <div className="flex items-center text-xl md:text-4xl text-blue-600 font-black font-mono tracking-tighter">
                    <Phone className="h-6 w-6 md:h-10 md:w-10 mr-4 fill-blue-600/10" /> {currentLead?.phoneNumber}
                  </div>
                </div>

                <div className="flex items-center space-x-6 py-4">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <svg className="w-6 h-6 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Call Duration</p>
                        <p className="text-2xl font-mono font-bold text-gray-900">{formatTime(timer)}</p>
                      </div>
                   </div>
                   <Button 
                     onClick={copyLeadLink} 
                     variant="outline"
                     className={`h-[84px] px-8 rounded-2xl font-bold border-2 transition-all ${isCopied ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                   >
                     {isCopied ? 'Link Copied!' : 'Copy Map Link'}
                   </Button>
                </div>

                <div className="flex-1 space-y-8 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">Disposition Workspace</p>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Select Outcome</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                    {/* PRIMARY OUTCOMES */}
                    <button 
                      onClick={() => handleStatusUpdate('Interested')} 
                      className="group flex items-center justify-center h-28 rounded-[32px] bg-white border border-white hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-xl shadow-emerald-100/20"
                    >
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">Interested</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('Successful Sale')} 
                      className="group flex items-center justify-center h-28 rounded-[32px] bg-white border border-white hover:border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl shadow-blue-100/20"
                    >
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">Sale</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('Callback Requested')} 
                      className="group flex items-center justify-center h-28 rounded-[32px] bg-white border border-white hover:border-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-xl shadow-amber-100/20"
                    >
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">Callback</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('Busy')} 
                      className="group flex items-center justify-center h-28 rounded-[32px] bg-white border border-white hover:border-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-300 shadow-xl shadow-gray-100/20"
                    >
                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">Busy</span>
                    </button>

                    {/* SECONDARY OUTCOMES */}
                    <button 
                      onClick={() => handleStatusUpdate('No Answer')} 
                      className="group flex items-center justify-center px-6 h-20 rounded-[28px] bg-white/40 backdrop-blur-sm border border-white hover:border-gray-400 hover:bg-white transition-all duration-200"
                    >
                      <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">No Answer</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('Failed')} 
                      className="group flex items-center justify-center px-6 h-20 rounded-[28px] bg-red-50/30 border border-red-100 hover:border-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                    >
                      <span className="font-black text-[10px] text-red-700 uppercase tracking-widest group-hover:text-white transition-colors">Failed</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('Not Interested')} 
                      className="group flex items-center justify-center px-6 h-20 rounded-[28px] bg-white/40 backdrop-blur-sm border border-white hover:border-gray-400 hover:bg-white transition-all duration-200"
                    >
                      <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Not Interested</span>
                    </button>

                    <button 
                      onClick={() => handleStatusUpdate('DNC')} 
                      className="group flex items-center justify-center px-6 h-20 rounded-[28px] bg-gray-900 text-gray-400 hover:text-red-500 border border-gray-800 hover:bg-black transition-all duration-200"
                    >
                      <span className="font-black text-[10px] uppercase tracking-[0.2em] transition-colors">DNC Mode</span>
                    </button>
                  </div>
                </div>

                <div className="pt-8 flex justify-between items-center text-gray-400">
                  <Button variant="ghost" onClick={stopDialing} className="hover:bg-red-50 hover:text-red-600">
                    <Square className="h-4 w-4 mr-2" /> Stop Session
                  </Button>
                  <div className="flex items-center space-x-4 text-xs font-medium">
                    <span>Queue: {queueIndex + 1} / {callQueue.length}</span>
                    <Button variant="ghost" size="sm" onClick={nextLead}>Skip <SkipForward className="h-3 w-3 ml-2" /></Button>
                  </div>
                </div>
              </div>
            ) : (
              /* AFTER-CALL WORK (ACW) STATE */
              <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 animate-in zoom-in-95 duration-500 bg-gradient-to-b from-indigo-50/50 to-white">
                 <div className="text-center space-y-4">
                    <div className="inline-flex items-center bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-indigo-200">
                       <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       Post-Call Processing
                    </div>
                    <h2 className="text-6xl font-bold text-gray-900 tracking-tight">Well Done.</h2>
                    <p className="text-gray-400 font-medium text-lg">Review your notes and prep for the next prospect.</p>
                 </div>

                 <div className="flex space-x-6">
                    <div className="bg-white/60 backdrop-blur-md px-10 py-6 rounded-3xl shadow-sm border border-white/50 text-center">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">Call Duration</p>
                      <p className="text-3xl font-mono font-bold text-gray-900">{formatTime(timer)}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md px-10 py-6 rounded-3xl shadow-sm border border-white/50 text-center">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Stay Active</p>
                      <p className="text-3xl font-mono font-bold text-gray-900">{formatTime(acwTimer)}</p>
                    </div>
                 </div>

                 {/* NEXT LEAD PRE-CALL PREP */}
                 {getNextLead() && (
                   <div className="w-full max-w-xl bg-white border-2 border-indigo-100 rounded-[40px] p-8 shadow-2xl shadow-indigo-100/50 flex flex-col items-center space-y-6 animate-in slide-in-from-bottom-12 duration-700 delay-200">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2 text-center">Up Next</p>
                        <h4 className="text-2xl font-bold text-gray-900">{getNextLead()?.name}</h4>
                      </div>
                      
                      <Button 
                        onClick={copyNextLeadLink} 
                        variant="secondary"
                        className={`h-16 px-10 rounded-2xl font-bold text-lg transition-all duration-300 w-full ${isNextCopied ? 'bg-green-100 text-green-700 scale-95' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      >
                        {isNextCopied ? (
                          <span className="flex items-center"><Check className="h-5 w-5 mr-3" /> Next Link Ready!</span>
                        ) : (
                          <span className="flex items-center italic text-sm">Research Next Candidate (Copy Link)</span>
                        )}
                      </Button>
                   </div>
                 )}

                 <div className="flex flex-col items-center w-full max-w-sm space-y-4">
                    <Button 
                      onClick={setReady} 
                      size="lg" 
                      className="w-full h-24 text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-3xl shadow-2xl shadow-blue-200 group relative overflow-hidden"
                    >
                      <span className="relative z-10">START NEXT CALL</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </Button>
                    
                    <div className="flex items-center space-x-6 text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                       <button onClick={stopDialing} className="hover:text-red-500 transition-colors px-4 py-2">Finish Session</button>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Persistent Notes Panel (Right 40% / Bottom on Mobile) */}
          <div className="flex-[2] flex flex-col p-8 bg-white border-l border-gray-100 shadow-xl overflow-y-auto min-h-[400px] lg:min-h-0">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Internal Notes
                </h3>
                <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${dialerStatus === 'calling' ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Syncing</span>
                </div>
             </div>
             
             <textarea
               className="flex-1 w-full p-8 bg-gray-50/50 rounded-3xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 text-gray-800 resize-none text-lg leading-relaxed placeholder:text-gray-300 placeholder:italic transition-all shadow-inner font-medium"
               placeholder="Type your notes here during the call... (Saved automatically)"
               value={localNotes}
               onChange={(e) => setLocalNotes(e.target.value)}
             />
             
             <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Lead Quick-Look</p>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-gray-500">Call Stage</span>
                     <span className="text-xs font-bold text-gray-900 uppercase tracking-tighter">{dialerStatus}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-xs text-gray-500">Website Status</span>
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${currentLead?.hasWebsite !== 'N/A' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {currentLead?.hasWebsite !== 'N/A' ? 'ACTIVE' : 'MISSING'}
                     </span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
