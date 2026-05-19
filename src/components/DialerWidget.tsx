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

          {/* Right Pane - Map & Business Info (60%) */}
          <div className="flex-1 bg-gray-100 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex space-x-2">
              <Badge className="bg-white/90 text-gray-700 backdrop-blur-sm border shadow-sm flex items-center space-x-2 px-3 py-1.5 capitalize">
                <MapPin className="h-3 w-3 text-red-500" />
                <span>Live Map Insight</span>
              </Badge>
              {currentLead?.googleMapsUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 bg-white/90 backdrop-blur-sm text-[10px] font-bold"
                  onClick={() => window.open(currentLead.googleMapsUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" /> Open Main Link
                </Button>
              )}
            </div>
            
            {currentLead?.googleMapsUrl ? (
              <div className="w-full h-full flex flex-col pt-12">
                <iframe 
                  src={`https://www.google.com/maps?q=${encodeURIComponent(currentLead.name + " " + currentLead.phoneNumber)}&output=embed&iwloc=addr`}
                  className="w-full h-full border-0 rounded-t-xl"
                  title="Google Maps Context"
                  allowFullScreen
                  loading="lazy"
                />
                <div className="p-3 bg-white border-t border-gray-200 text-center flex items-center justify-center space-x-4">
                  <div className="text-[10px] text-gray-400 font-medium">Card display mode active</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    onClick={() => window.open(currentLead.googleMapsUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" /> View Full Reviews & SPA Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 p-12 text-center bg-gray-50">
                <div className="space-y-2">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No map data available for this lead.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
