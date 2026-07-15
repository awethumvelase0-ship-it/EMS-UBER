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

  // Active distress tickets (excludes completed and scheduled future trips)
  const activeTrips = trips.filter(t => t.status !== TripStatus.COMPLETED && t.status !== TripStatus.SCHEDULED);
  const scheduledTrips = trips.filter(t => t.status === TripStatus.SCHEDULED);
  const completedTrips = trips.filter(t => t.status === TripStatus.COMPLETED);

  const stats = {
    totalActive: activeTrips.length,
    totalScheduled: scheduledTrips.length,
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
        <div className="bg-white border-l-4 border-l-red-600 border-y border-r border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-red-50 p-2 text-red-600 border border-red-200">
            <Siren className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">ACTIVE EMERGENCIES</span>
            <strong className="text-2xl font-mono font-black text-zinc-900">{stats.totalActive}</strong>
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-blue-600 border-y border-r border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-blue-50 p-2 text-blue-600 border border-blue-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">ALS MEDIC UNITS AVAILABLE</span>
            <strong className="text-2xl font-mono font-black text-blue-700">{stats.availableALS}</strong>
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-amber-600 border-y border-r border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-amber-50 p-2 text-amber-600 border border-amber-200">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">BLS EMT UNITS AVAILABLE</span>
            <strong className="text-2xl font-mono font-black text-amber-700">{stats.availableBLS}</strong>
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-emerald-600 border-y border-r border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-emerald-50 p-2 text-emerald-600 border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">COMPLETED CLINICAL RUNS</span>
            <strong className="text-2xl font-mono font-black text-emerald-700">{stats.completedToday}</strong>
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
        <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex flex-col h-[380px] overflow-hidden">
          <h3 className="text-xs font-black text-zinc-950 uppercase tracking-[0.2em] pb-3 border-b border-zinc-200 flex items-center gap-2 font-display">
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            <span>EMERGENCY DISPATCH QUEUE</span>
          </h3>

          <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
            {activeTrips.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-6">
                <div>
                  <CheckCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
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
                  <div key={trip.id} className="bg-zinc-50 border border-zinc-200 rounded-none p-3.5 space-y-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 block">ID: {trip.id}</span>
                        <strong className="text-xs text-zinc-900 uppercase font-display block truncate max-w-[150px]">{trip.locationName}</strong>
                      </div>
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-none border ${
                        trip.triageLevel === TriageLevel.RED ? "bg-red-50 text-red-700 border-red-200 animate-pulse" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {trip.triageLevel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-600">Caller: <strong className="text-zinc-900">{trip.callerPhone}</strong></span>
                      <span className="text-zinc-500 uppercase font-black tracking-widest text-[9px]">{trip.status}</span>
                    </div>

                    {/* Ambulance assignment selection */}
                    {trip.status === TripStatus.PANIC_TRIGGERED && !trip.ambulanceId ? (
                      <div className="bg-red-50 border border-red-200 p-2.5 rounded-none space-y-2 mt-1 shadow-xs">
                        <span className="text-[9px] font-mono text-red-700 font-bold block uppercase tracking-wider">
                          MANDATORY {trip.triageLevel === "RED" ? "ALS" : "EMERGENCY"} UNIT DISPATCH REQUIRED
                        </span>
                        
                        <div className="flex gap-1.5">
                          <select 
                            value={selectedAmbForManual[trip.id] || ""} 
                            onChange={(e) => setSelectedAmbForManual(prev => ({...prev, [trip.id]: e.target.value}))}
                            className="bg-white border border-zinc-300 text-[10px] text-zinc-800 font-mono p-1 rounded-none focus:outline-none flex-1 font-bold"
                          >
                            <option value="">Select available unit...</option>
                            {availableAmbulances.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleManualDispatchSubmit(trip.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black font-mono uppercase px-3 py-1 border border-red-750 rounded-none shrink-0"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    ) : (
                      assigned && (
                        <div className="bg-white p-2 rounded-none text-[10px] border border-zinc-200 flex justify-between items-center font-mono shadow-xs">
                          <span className="text-zinc-600">Assigned Unit: <strong className="text-blue-700 font-black">{assigned.name}</strong></span>
                          <span className="text-zinc-550 uppercase font-bold">({assigned.type})</span>
                        </div>
                      )
                    )}

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => onForceCancel(trip.id)}
                        className="text-[9px] text-red-600 font-black font-mono uppercase tracking-wider hover:underline"
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

      {/* 📅 PRE-BOOKED SCHEDULED TRANSPORTS QUEUE */}
      <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
        <div className="border-b border-zinc-200 pb-3 flex justify-between items-center">
          <h3 className="text-xs font-black text-zinc-950 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>📅 FUTURE & PRE-BOOKED PATIENT TRANSPORTS</span>
          </h3>
          <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 border border-zinc-200 uppercase tracking-widest">
            {scheduledTrips.length} Bookings Pending
          </span>
        </div>

        {scheduledTrips.length === 0 ? (
          <div className="text-center p-8 bg-zinc-50 border border-dashed border-zinc-200">
            <span className="text-xs font-black font-mono text-zinc-500 block uppercase tracking-widest">NO UPCOMING ADVANCE TRANSPORTS</span>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
              Any future-dated client bookings will appear here for fleet prep and dispatch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledTrips.map((trip) => {
              const prebookedAmb = ambulances.find(a => a.id === trip.ambulanceId);
              const availableUnits = ambulances.filter(a => a.status === AmbulanceStatus.AVAILABLE);
              const isPrebookedUnitAvailable = prebookedAmb ? prebookedAmb.status === AmbulanceStatus.AVAILABLE : false;
              
              return (
                <div key={trip.id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-none space-y-3 flex flex-col justify-between shadow-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-zinc-500 block">ID: {trip.id}</span>
                        <span className="bg-zinc-900 text-white text-[9px] font-mono px-2 py-0.5 font-black uppercase tracking-widest rounded-none">
                          📅 {trip.scheduledAt || "Scheduled"}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-none border uppercase tracking-wider ${
                        trip.triageLevel === TriageLevel.RED ? "bg-red-50 text-red-700 border-red-200" :
                        trip.triageLevel === TriageLevel.YELLOW ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {trip.triageLevel} CLASS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 border-t border-b border-zinc-200/60 py-2">
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px] block">Patient</span>
                        <strong className="text-zinc-900 uppercase font-bold">{trip.patientInfo.name}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px] block">Telephone</span>
                        <strong className="text-zinc-900">{trip.callerPhone}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500 uppercase text-[8px] block">Route Details</span>
                        <span className="text-zinc-800 font-bold uppercase">{trip.locationName}</span>
                        <span className="text-zinc-400 mx-1">→</span>
                        <span className="text-zinc-800 font-bold uppercase">{trip.destinationHospital}</span>
                      </div>
                      {trip.patientInfo.medicalHistory && (
                        <div className="col-span-2 text-[10px] text-zinc-600 bg-white p-1.5 border border-zinc-150 uppercase tracking-wide">
                          <span className="text-[8px] font-black block text-zinc-500">Declared History / Transfer Notes</span>
                          {trip.patientInfo.medicalHistory}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-600">Pre-Booked Unit:</span>
                      {prebookedAmb ? (
                        <span className={`font-bold px-1.5 py-0.5 uppercase ${
                          isPrebookedUnitAvailable ? "text-teal-700 bg-teal-50 border border-teal-200" : "text-zinc-500 bg-zinc-100 border border-zinc-200"
                        }`}>
                          {prebookedAmb.name} ({prebookedAmb.type}) - {prebookedAmb.status}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">AUTO-ALLOCATE ON DISPATCH</span>
                      )}
                    </div>

                    {/* Manual Override Unit select if not available or auto-allocated */}
                    <div className="flex gap-1.5 pt-1">
                      <select 
                        value={selectedAmbForManual[trip.id] || trip.ambulanceId || ""} 
                        onChange={(e) => setSelectedAmbForManual(prev => ({...prev, [trip.id]: e.target.value}))}
                        className="bg-white border border-zinc-300 text-[10px] text-zinc-800 font-mono p-1 rounded-none focus:outline-none flex-1 font-bold"
                      >
                        <option value="">Choose Unit for dispatch...</option>
                        {ambulances.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type}) - {a.status}
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const unitId = selectedAmbForManual[trip.id] || trip.ambulanceId;
                          if (!unitId) {
                            alert("Please select or assign an ambulance unit first.");
                            return;
                          }
                          onManualDispatch(trip.id, unitId);
                        }}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white text-[9px] font-black font-mono uppercase px-3.5 py-1 border border-zinc-950 rounded-none shrink-0 tracking-widest"
                      >
                        🚨 Dispatch Now
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200/50">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-mono text-zinc-400 uppercase">HIPAA PIN:</span>
                        <strong className="text-[10px] font-mono text-zinc-800 tracking-wider font-black">{trip.patientInfo.accessCode}</strong>
                      </div>
                      <button 
                        onClick={() => onForceCancel(trip.id)}
                        className="text-[9px] text-red-600 font-black font-mono uppercase tracking-wider hover:underline"
                      >
                        Remove Booking &times;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fleet Grid Status Table */}
      <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
        <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
          <Layers className="w-4 h-4 text-zinc-600" />
          <span>REAL-TIME ACTIVE FLEET REGISTER</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-mono text-zinc-600 uppercase font-black tracking-widest">
                <th className="py-3">UNIT IDENTIFIER</th>
                <th className="py-3">EQUIPMENT CLASS</th>
                <th className="py-3">STATUS DESIGNATION</th>
                <th className="py-3">GPS LAT/LNG COORDS</th>
                <th className="py-3">ON-BOARD MEDICAL CREW</th>
                <th className="py-3">INTEGRATED STREAMING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {ambulances.map((amb) => {
                let statusColor = "text-zinc-600 bg-zinc-100 border-zinc-200";
                if (amb.status === AmbulanceStatus.AVAILABLE) statusColor = "text-blue-700 bg-blue-50 border-blue-200";
                else if (amb.status === AmbulanceStatus.ON_ROUTE) statusColor = "text-amber-700 bg-amber-50 border-amber-200";
                else if (amb.status === AmbulanceStatus.AT_SCENE) statusColor = "text-red-700 bg-red-50 border-red-200";
                else if (amb.status === AmbulanceStatus.TRANSPORTING) statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

                return (
                  <tr key={amb.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 font-black text-zinc-900 font-display uppercase tracking-wider text-[13px]">{amb.name}</td>
                    <td className="py-4 font-mono text-zinc-600 font-bold uppercase tracking-wider">{amb.type} SUPPORT</td>
                    <td className="py-4">
                      <span className={`text-[9px] font-mono font-black px-2.5 py-1 border rounded-none uppercase tracking-widest ${statusColor}`}>
                        {amb.status}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-[11px] text-zinc-600 tracking-tight">
                      {amb.location.lat.toFixed(5)} &deg;N, {amb.location.lng.toFixed(5)} &deg;W
                    </td>
                    <td className="py-4 text-zinc-850 font-mono text-[11px] uppercase tracking-wide">{amb.crew.join(" | ")}</td>
                    <td className="py-4 text-[10px] font-mono">
                      {amb.vitalsMonitoringSupported ? (
                        <span className="text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
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
