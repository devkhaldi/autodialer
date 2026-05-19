"use client";

import { useState, useEffect, useRef } from 'react';
import { useDialerStore } from '@/store/dialerStore';
import { useLeadStore, Lead } from '@/store/leadStore';
import { Button } from './ui/Button';
import { Phone, Play, Square, SkipForward, MapPin, ExternalLink, ListFilter } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';

export function DialerWidget() {
  const { 
    isDialing, currentLead, callQueue, queueIndex, timer,
    startDialing, stopDialing, nextLead,
    incrementTimer, resetTimer, clearQueue 
  } = useDialerStore();
  
  const { leads, activeListId, lists, setActiveList, updateLeadStatus } = useLeadStore();
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isDialing) {
      timerRef.current = setInterval(() => {
        incrementTimer();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDialing, incrementTimer]);

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
    
    // Update local state and XLSX via store
    await updateLeadStatus(currentLead.id, status);
    setLastSaved(new Date().toLocaleTimeString());
    
    // Move to next lead in dialer
    nextLead();
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
    alert("Map link copied to clipboard!");
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
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
            {lists.length === 0 && <option value="">No lists available</option>}
          </select>
        </div>

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
        /* SPLIT PANE DIALER */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane - Controls (40%) */}
          <div className="w-[40%] border-r border-gray-100 flex flex-col p-6 overflow-y-auto bg-gray-50/30">
            <div className="space-y-6">
              <div className="space-y-2">
                <Badge variant="outline" className="bg-white">CURRENT LEAD</Badge>
                <h2 className="text-2xl font-bold text-gray-900">{currentLead?.name}</h2>
                <div className="flex items-center text-lg text-blue-600 font-medium font-mono">
                  <Phone className="h-4 w-4 mr-2" /> {currentLead?.phoneNumber}
                </div>
              </div>

              <Card className="shadow-none border-gray-200">
                <CardContent className="p-4 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start h-12" onClick={() => window.open(`tel:${currentLead?.phoneNumber}`)}>
                        <Phone className="h-4 w-4 mr-2 text-green-500" /> Dial Manually
                      </Button>
                      <Button variant="outline" className="justify-start h-12" onClick={() => window.open(currentLead?.googleMapsUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2 text-blue-500" /> Open External
                      </Button>
                   </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Set Call Result</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleStatusUpdate('Interested')} variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Interested</Button>
                  <Button onClick={() => handleStatusUpdate('Successful Sale')} variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Sale Confirmed</Button>
                  <Button onClick={() => handleStatusUpdate('Callback Requested')} variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">Callback</Button>
                  <Button onClick={() => handleStatusUpdate('Not Interested')} variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100">Not Interested</Button>
                  <Button onClick={() => handleStatusUpdate('No Answer')} variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100">No Answer</Button>
                  <Button onClick={() => handleStatusUpdate('Busy')} variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-100">Busy</Button>
                  <Button onClick={() => handleStatusUpdate('Failed')} variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 col-span-2">Call Failed / Busy</Button>
                  <Button onClick={() => handleStatusUpdate('DNC')} variant="outline" className="bg-red-900/10 text-red-900 border-red-900/20 col-span-2">Do Not Call</Button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <span>{lastSaved ? `Last saved to file: ${lastSaved}` : 'Ready to sync to file'}</span>
              </div>

              <div className="pt-6 border-t border-gray-200 flex space-x-2">
                <Button variant="destructive" onClick={stopDialing} className="flex-1">
                  <Square className="h-4 w-4 mr-2" /> End Session
                </Button>
                <Button variant="outline" onClick={nextLead} className="flex-1">
                  <SkipForward className="h-4 w-4 mr-2" /> Skip Lead
                </Button>
              </div>

              {/* Session History Mini-List */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Recently Contacted</p>
                <div className="space-y-2">
                  {leads.filter(l => l.listId === activeListId && l.status !== 'Uncalled').slice().reverse().slice(0, 3).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-gray-100">
                      <div className="truncate pr-2">
                        <span className="font-medium text-gray-900">{l.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{l.status}</Badge>
                    </div>
                  ))}
                  {leads.filter(l => l.listId === activeListId && l.status !== 'Uncalled').length === 0 && (
                     <p className="text-[10px] text-gray-400 italic">No calls made yet this session.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane - High-Fidelity Business Card (60%) */}
          <div className="flex-1 bg-white flex flex-col relative overflow-hidden border-l border-gray-200">
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-6 space-y-6">
                {/* Header: Name, Rating, Category */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-normal text-gray-900">{currentLead?.name}</h3>
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="font-semibold text-gray-700">{currentLead?.rating || '4.5'}</span>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-4 w-4 fill-current ${i < Math.floor(Number(currentLead?.rating || 4)) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-500">({currentLead?.reviews_count || currentLead?.reviews || '0'})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentLead?.niche || 'Service Provider'} • <span className="text-blue-600">♿</span>
                  </div>
                </div>

                {/* Tabs (Simulated) */}
                <div className="flex space-x-6 border-b border-gray-100 pb-2 text-sm font-medium">
                  <span className="text-blue-600 border-b-2 border-blue-600 pb-2">Overview</span>
                  <span className="text-gray-500 pb-2">Reviews</span>
                  <span className="text-gray-500 pb-2">About</span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center py-2">
                   <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600">
                         <Phone className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">Directions</span>
                   </div>
                   <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">Save</span>
                   </div>
                   <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600">
                         <MapPin className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">Nearby</span>
                   </div>
                   <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600">
                         <SkipForward className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">Send to...</span>
                   </div>
                   <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center text-blue-600 pointer-events-auto cursor-pointer" onClick={copyLeadLink}>
                         <ExternalLink className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold underline">Copy link</span>
                   </div>
                </div>

                {/* Info List */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-gray-800">
                      {currentLead?.address || 'Address not listed in XLSX'}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div className="text-sm space-y-0.5">
                      <div className="font-medium text-red-600">Closed • <span className="text-gray-500 font-normal">Opens 10 AM Tue</span></div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-gray-800">{currentLead?.phoneNumber}</div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                    <div className="text-sm text-gray-800 font-mono">8CM4+92 Jacksonville, FL, USA</div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
                    <div className="text-sm text-gray-800">Your Maps history</div>
                  </div>
                </div>

                {/* Additional XLSX Metadata Section */}
                <div className="pt-8 border-t border-gray-100">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Extended Data Panel</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {Object.entries(currentLead || {})
                        .filter(([k]) => !['id', 'name', 'phoneNumber', 'googleMapsUrl', 'listId', '__id', 'status', 'notes', 'rating', 'reviews_count', 'niche', 'address'].includes(k))
                        .map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">{key.replace(/_/g, ' ')}</span>
                             <span className="text-xs font-semibold text-gray-900 truncate block">{String(value)}</span>
                          </div>
                        ))
                      }
                   </div>
                </div>
              </div>
            </div>
            
            {/* Footer Quick Launch */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
               <span className="text-xs font-medium text-gray-500">Full Business Card View</span>
               <Button variant="outline" size="sm" onClick={() => window.open(currentLead?.googleMapsUrl, '_blank')}>
                 <ExternalLink className="h-4 w-4 mr-2" /> Launch Research Mode
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
