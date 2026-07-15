/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, Siren, ShieldAlert, Navigation, Layers, 
  MapPin, CheckCircle, Activity, ChevronRight 
} from "lucide-react";
import { Ambulance, DispatchTrip, TripStatus, TriageLevel, AmbulanceStatus } from "../types";
import LiveEMSMap from "./LiveEMSMap";

interface DispatcherDashboardProps {
  ambulances: Ambulance[];
  trips: DispatchTrip[];
  onManualDispatch: (tripId: string, ambulanceId: string) => Promise<void>;
  onForceCancel: (tripId: string) => Promise<void>;
}

export default function DispatcherDashboard({
  ambulances,
  trips,
  onManualDispatch,
  onForceCancel
}: DispatcherDashboardProps) {
  const [selectedAmbForManual, setSelectedAmbForManual] = useState<Record<string, string>>({});

  // Active distress tickets (not completed)
  const activeTrips = trips.filter(t => t.status !== TripStatus.COMPLETED);
  const completedTrips = trips.filter(t => t.status === TripStatus.COMPLETED);

  const stats = {
    totalActive: activeTrips.length,
    availableALS: ambulances.filter(a => a.type === "ALS" && a.status === "AVAILABLE").length,
    availableBLS: ambulances.filter(a => a.type === "BLS" && a.status === "AVAILABLE").length,
    completedToday: completedTrips.length
  };

  const handleManualDispatchSubmit = async (tripId: string) => {
    const ambId = selectedAmbForManual[tripId];
    if (!ambId) return;
    await onManualDispatch(tripId, ambId);
  };

  return (
    <div className="space-y-6">
      {/* Grid Stats HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E0E11] border-l-4 border-l-red-600 border-y border-r border-zinc-800 p-4 rounded-none flex items-center gap-3.5 shadow-xl">
          <div className="bg-red-600/15 p-2 text-red-500 border border-red-900/40">
            <Siren className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">ACTIVE EMERGENCIES</span>
            <strong className="text-2xl font-mono font-black text-white">{stats.totalActive}</strong>
          </div>
        </div>

        <div className="bg-[#0E0E11] border-l-4 border-l-blue-600 border-y border-r border-zinc-800 p-4 rounded-none flex items-center gap-3.5 shadow-xl">
          <div className="bg-blue-600/15 p-2 text-blue-400 border border-blue-900/40">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">ALS MEDIC UNITS AVAILABLE</span>
            <strong className="text-2xl font-mono font-black text-blue-400">{stats.availableALS}</strong>
          </div>
        </div>

        <div className="bg-[#0E0E11] border-l-4 border-l-amber-600 border-y border-r border-zinc-800 p-4 rounded-none flex items-center gap-3.5 shadow-xl">
          <div className="bg-amber-600/15 p-2 text-amber-500 border border-amber-900/40">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">BLS EMT UNITS AVAILABLE</span>
            <strong className="text-2xl font-mono font-black text-amber-400">{stats.availableBLS}</strong>
          </div>
        </div>

        <div className="bg-[#0E0E11] border-l-4 border-l-emerald-600 border-y border-r border-zinc-800 p-4 rounded-none flex items-center gap-3.5 shadow-xl">
          <div className="bg-emerald-600/15 p-2 text-emerald-500 border border-emerald-900/40">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">COMPLETED CLINICAL RUNS</span>
            <strong className="text-2xl font-mono font-black text-emerald-400">{stats.completedToday}</strong>
          </div>
        </div>
      </div>

      {/* Map and Active Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Simulated Coordinate Map */}
        <div className="lg:col-span-2 space-y-3">
          <LiveEMSMap ambulances={ambulances} activeTrip={activeTrips[0]} title="Dispatcher Live Fleet Coordination Map" />
        </div>

        {/* Emergency Dispatch Live Queue */}
        <div className="bg-[#0E0E11] border border-zinc-800 rounded-none p-5 shadow-2xl flex flex-col h-[380px] overflow-hidden">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] pb-3 border-b border-zinc-800 flex items-center gap-2 font-display">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span>EMERGENCY DISPATCH QUEUE</span>
          </h3>

          <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
            {activeTrips.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6">
                <div>
                  <CheckCircle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <span className="text-xs font-black font-mono text-zinc-500 uppercase tracking-wider block">ALL SITES CLEAR</span>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1.5 leading-normal">
                    No pending emergency panic signals. Dispatch monitor is on standby.
                  </p>
                </div>
              </div>
            ) : (
              activeTrips.map((trip) => {
                const assigned = ambulances.find(a => a.id === trip.ambulanceId);
                const availableAmbulances = ambulances.filter(a => a.status === AmbulanceStatus.AVAILABLE);

                return (
                  <div key={trip.id} className="bg-[#111114] border border-zinc-800 rounded-none p-3.5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block">ID: {trip.id}</span>
                        <strong className="text-xs text-white uppercase font-display block truncate max-w-[150px]">{trip.locationName}</strong>
                      </div>
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-none border ${
                        trip.triageLevel === TriageLevel.RED ? "bg-red-950 text-red-400 border-red-900 animate-pulse" : "bg-amber-950 text-amber-400 border-amber-900"
                      }`}>
                        {trip.triageLevel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-400">Caller: <strong className="text-zinc-200">{trip.callerPhone}</strong></span>
                      <span className="text-zinc-500 uppercase font-black tracking-widest text-[9px]">{trip.status}</span>
                    </div>

                    {/* Ambulance assignment selection */}
                    {trip.status === TripStatus.PANIC_TRIGGERED && !trip.ambulanceId ? (
                      <div className="bg-red-950/20 border border-red-900/40 p-2.5 rounded-none space-y-2 mt-1">
                        <span className="text-[9px] font-mono text-red-400 font-bold block uppercase tracking-wider">
                          MANDATORY {trip.triageLevel === "RED" ? "ALS" : "EMERGENCY"} UNIT DISPATCH REQUIRED
                        </span>
                        
                        <div className="flex gap-1.5">
                          <select 
                            value={selectedAmbForManual[trip.id] || ""} 
                            onChange={(e) => setSelectedAmbForManual(prev => ({...prev, [trip.id]: e.target.value}))}
                            className="bg-[#0A0A0B] border border-zinc-800 text-[10px] text-zinc-300 font-mono p-1 rounded-none focus:outline-none flex-1 font-bold"
                          >
                            <option value="">Select available unit...</option>
                            {availableAmbulances.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleManualDispatchSubmit(trip.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black font-mono uppercase px-3 py-1 border border-red-900 rounded-none shrink-0"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    ) : (
                      assigned && (
                        <div className="bg-[#0A0A0B] p-2 rounded-none text-[10px] border border-zinc-800 flex justify-between items-center font-mono">
                          <span className="text-zinc-400">Assigned Unit: <strong className="text-blue-400 font-black">{assigned.name}</strong></span>
                          <span className="text-zinc-500 uppercase font-bold">({assigned.type})</span>
                        </div>
                      )
                    )}

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => onForceCancel(trip.id)}
                        className="text-[9px] text-red-500 font-black font-mono uppercase tracking-wider hover:underline"
                      >
                        Force Abort &times;
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Fleet Grid Status Table */}
      <div className="bg-[#0E0E11] border border-zinc-800 rounded-none p-5 shadow-2xl space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 font-display">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span>REAL-TIME ACTIVE FLEET REGISTER</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-850 text-[10px] font-mono text-zinc-500 uppercase font-black tracking-widest">
                <th className="py-3">UNIT IDENTIFIER</th>
                <th className="py-3">EQUIPMENT CLASS</th>
                <th className="py-3">STATUS DESIGNATION</th>
                <th className="py-3">GPS LAT/LNG COORDS</th>
                <th className="py-3">ON-BOARD MEDICAL CREW</th>
                <th className="py-3">INTEGRATED STREAMING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {ambulances.map((amb) => {
                let statusColor = "text-zinc-400 bg-zinc-900 border-zinc-800";
                if (amb.status === AmbulanceStatus.AVAILABLE) statusColor = "text-blue-400 bg-blue-950/40 border-blue-900";
                else if (amb.status === AmbulanceStatus.ON_ROUTE) statusColor = "text-amber-400 bg-amber-950/40 border-amber-900";
                else if (amb.status === AmbulanceStatus.AT_SCENE) statusColor = "text-red-400 bg-red-950/40 border-red-900";
                else if (amb.status === AmbulanceStatus.TRANSPORTING) statusColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900";

                return (
                  <tr key={amb.id} className="hover:bg-[#111114] transition-colors">
                    <td className="py-4 font-black text-white font-display uppercase tracking-wider text-[13px]">{amb.name}</td>
                    <td className="py-4 font-mono text-zinc-400 font-bold uppercase tracking-wider">{amb.type} SUPPORT</td>
                    <td className="py-4">
                      <span className={`text-[9px] font-mono font-black px-2.5 py-1 border rounded-none uppercase tracking-widest ${statusColor}`}>
                        {amb.status}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-[11px] text-zinc-400 tracking-tight">
                      {amb.location.lat.toFixed(5)} &deg;N, {amb.location.lng.toFixed(5)} &deg;W
                    </td>
                    <td className="py-4 text-zinc-300 font-mono text-[11px] uppercase tracking-wide">{amb.crew.join(" | ")}</td>
                    <td className="py-4 text-[10px] font-mono">
                      {amb.vitalsMonitoringSupported ? (
                        <span className="text-green-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                          <span>Streaming (Secure)</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 uppercase font-black">Voice Comms Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
