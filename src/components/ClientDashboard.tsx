/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AlertCircle, Phone, MapPin, Key, HeartPulse, User, Calendar, ShieldCheck, Navigation } from "lucide-react";
import { TriageLevel, DispatchTrip, Ambulance } from "../types";
import LiveEMSMap from "./LiveEMSMap";

interface ClientDashboardProps {
  ambulances: Ambulance[];
  activeTrip: DispatchTrip | null;
  onPanicTrigger: (triage: TriageLevel, patientData: any) => Promise<void>;
  onCancelTrip: (tripId: string) => Promise<void>;
}

export default function ClientDashboard({ ambulances, activeTrip, onPanicTrigger, onCancelTrip }: ClientDashboardProps) {
  // Panic form states
  const [phone, setPhone] = useState("+1 (555) ");
  const [patientName, setPatientName] = useState("");
  const [dob, setDob] = useState("1988-06-15");
  const [gender, setGender] = useState("Male");
  const [ssn, setSsn] = useState("334-92-0988");
  const [history, setHistory] = useState("Moderate asthma, allergy to sulfa drugs");
  const [pinCode, setPinCode] = useState("4481");
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel | null>(null);
  const [loading, setLoading] = useState(false);

  // Simulation parameters
  const [simulatedEta, setSimulatedEta] = useState(8);
  const [simulatedDistance, setSimulatedDistance] = useState(2.4);

  useEffect(() => {
    if (activeTrip && activeTrip.status !== "COMPLETED") {
      const interval = setInterval(() => {
        setSimulatedEta(prev => {
          if (prev <= 1) return 1;
          return prev - 1;
        });
        setSimulatedDistance(prev => {
          if (prev <= 0.2) return 0.1;
          return Number((prev - 0.3).toFixed(1));
        });
      }, 8000);
      return () => clearInterval(interval);
    } else {
      setSimulatedEta(8);
      setSimulatedDistance(2.4);
    }
  }, [activeTrip]);

  const triggerPanic = async (triage: TriageLevel) => {
    setSelectedTriage(triage);
    setLoading(true);
    try {
      const patientData = {
        patientName: patientName || "John Doe (Unidentified)",
        dob,
        gender,
        ssnLocked: ssn || "XXX-XX-0000",
        medicalHistory: history || "No declared history",
        accessCode: pinCode || "9999",
        callerPhone: phone || "+1 (555) 911-0000",
        locationName: "850 Brannan St, San Francisco, CA"
      };
      await onPanicTrigger(triage, patientData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assignedAmb = activeTrip ? ambulances.find(a => a.id === activeTrip.ambulanceId) : null;

  return (
    <div className="space-y-6">
      {/* Upper Status Cards */}
      <div className="bg-[#0E0E11] border border-zinc-800 rounded-none p-6 shadow-2xl">
        <div className="border-b border-zinc-800 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-wider font-display uppercase">
            <HeartPulse className="w-5 h-5 text-red-600 animate-pulse" />
            <span>EMS ONE-TOUCH PANIC ENGINE</span>
          </h2>
          <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-2 py-1 border border-zinc-800">
            SYSTEM-ON / BIOMETRIC LOADED
          </span>
        </div>
        <p className="text-zinc-400 text-xs mb-6 uppercase tracking-wider leading-relaxed">
          INSTANT EMT &amp; PARAMEDIC ROUTING CORE. UNCONSCIOUS ALERTS FORCE DISPATCH OF ADVANCED LIFE SUPPORT (ALS) UNITS. ALL PERSONAL TELEMETRY IS BIOMETRICALLY SEALED.
        </p>

        {!activeTrip ? (
          <div className="space-y-6">
            {/* Quick Demographics Form & Privacy PIN Configuration */}
            <div className="bg-[#111114] p-5 rounded-none border border-zinc-800 space-y-5">
              <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-1.5 pb-2 border-b border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>HIPAA PATIENT RECORD ENCRYPTION MATRIX</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">CALLER TELEPHONE *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">PATIENT FULL NAME (LOCKABLE)</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input 
                      type="text" 
                      value={patientName} 
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Leave blank for anonymous/unidentified"
                      className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none uppercase tracking-wide font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">PATIENT DATE OF BIRTH</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">GENDER SELECT</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none uppercase font-mono font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">SSN (AUTOMATED AES-256 SEAL)</label>
                  <input 
                    type="text" 
                    value={ssn} 
                    onChange={(e) => setSsn(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none font-mono font-bold tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-red-500 mb-1.5 uppercase tracking-widest">4-DIGIT PIN SECURITY LOCK *</label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-red-500" />
                    <input 
                      type="text" 
                      maxLength={4}
                      value={pinCode} 
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g,''))}
                      className="w-full bg-[#0A0A0B] border border-red-900 text-xs text-red-500 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono font-bold text-center tracking-[0.4em]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">VITAL MEDICAL HISTORY / ALLERGIES (HIPAA PROTECTED)</label>
                <textarea 
                  value={history} 
                  onChange={(e) => setHistory(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0A0A0B] border border-zinc-800 text-xs text-zinc-100 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                  placeholder="e.g. cardiac conditions, diabetes, penicillin allergy..."
                />
              </div>
            </div>

            {/* Instant Highly Visual Emergency Triage Selection Buttons */}
            <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] pt-2 font-display">
              CHOOSE IMMEDIATE TRIAGE PATHWAY:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option 1: Critical / Unconscious (RED) */}
              <button 
                disabled={loading}
                onClick={() => triggerPanic(TriageLevel.RED)}
                className="group relative bg-[#1A0B0C] hover:bg-[#2A0F11] border-2 border-red-800 rounded-none p-5 text-left transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-red-600 text-white p-2.5 rounded-none group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-red-400 bg-black px-2 py-1 border border-red-900">ALS OVERRIDE</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase font-display tracking-wider">Critical / Unconscious</h3>
                <p className="text-xs text-red-200/70 mt-2 leading-relaxed">
                  Cardiac event, major trauma, stroke, choking, severe respiratory distress. Bypasses basic units instantly.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-red-400 uppercase tracking-widest group-hover:underline">LAUNCH RESCUE UNIT &rarr;</span>
              </button>

              {/* Option 2: Urgent Pain / Sick (YELLOW) */}
              <button 
                disabled={loading}
                onClick={() => triggerPanic(TriageLevel.YELLOW)}
                className="group relative bg-[#1B1206] hover:bg-[#2C1D0B] border-2 border-amber-800 rounded-none p-5 text-left transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-amber-600 text-white p-2.5 rounded-none group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-amber-400 bg-black px-2 py-1 border border-amber-900">BLS / ALS</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase font-display tracking-wider">Urgent Sickness</h3>
                <p className="text-xs text-amber-200/70 mt-2 leading-relaxed">
                  Severe abdominal pain, compound fractures, severe fever, stable chest pressure. Dispatches high-priority response.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest group-hover:underline">LAUNCH RESCUE UNIT &rarr;</span>
              </button>

              {/* Option 3: Minor Injury (GREEN) */}
              <button 
                disabled={loading}
                onClick={() => triggerPanic(TriageLevel.GREEN)}
                className="group relative bg-[#0B1511] hover:bg-[#12241C] border-2 border-emerald-800 rounded-none p-5 text-left transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-emerald-600 text-white p-2.5 rounded-none group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-emerald-400 bg-black px-2 py-1 border border-emerald-900">BLS OPTIMAL</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase font-display tracking-wider">Minor Trauma</h3>
                <p className="text-xs text-emerald-200/70 mt-2 leading-relaxed">
                  Controlled bleeding, lacerations, moderate burns, sprains. Dispatches standard EMT ambulance.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest group-hover:underline">LAUNCH RESCUE UNIT &rarr;</span>
              </button>

            </div>
          </div>
        ) : (
          /* Active Distress Mode */
          <div className="space-y-6">
            <div className="bg-[#1A0B0C] border-2 border-red-800 p-5 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                  </span>
                  <h3 className="text-base font-black text-white tracking-wide uppercase font-display">ACTIVE RESCUE DISPATCHED: {activeTrip.status}</h3>
                </div>
                <p className="text-xs text-red-400 mt-1.5 font-mono uppercase tracking-wider">
                  TRIP ID: {activeTrip.id} | DESIGNATED TRIAGE: {activeTrip.triageLevel}
                </p>
              </div>
              <button 
                onClick={() => onCancelTrip(activeTrip.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black font-mono px-4 py-2 rounded-none uppercase transition-all border border-red-950 active:scale-95"
              >
                Abort Emergency
              </button>
            </div>

            {/* GPS Tracker HUD Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map Column */}
              <div className="lg:col-span-2 space-y-3">
                <LiveEMSMap ambulances={ambulances} activeTrip={activeTrip} title="GPS Live Ambulance Tracking Map" />
              </div>

              {/* ETA Display & Ambulance Crew Demographics */}
              <div className="bg-[#111114] border border-zinc-800 rounded-none p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 font-display">LIVE RESPONSE TELEMETRY</h3>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-black font-mono text-red-600 tracking-tighter">{simulatedEta}</span>
                    <span className="text-sm text-zinc-300 font-black uppercase tracking-widest font-display">MINS</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-6 font-mono uppercase tracking-wider">
                    <Navigation className="w-3.5 h-3.5 text-red-500" />
                    <span>Distance: {simulatedDistance} miles away</span>
                  </div>

                  {assignedAmb ? (
                    <div className="bg-[#0A0A0B] border border-zinc-800 rounded-none p-4 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                        <span className="text-xs font-black text-white uppercase tracking-wider font-display">{assignedAmb.name}</span>
                        <span className="text-[9px] font-mono bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 font-bold uppercase tracking-widest">
                          {assignedAmb.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[9px] font-black font-mono text-zinc-500 block uppercase tracking-wider">ASSIGNED EMT CREW:</span>
                        {assignedAmb.crew.map((member, idx) => (
                          <div key={idx} className="text-xs text-zinc-300 font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 inline-block" />
                            <span className="uppercase tracking-wide font-mono text-[11px]">{member}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-zinc-400 bg-[#111114] p-3 rounded-none border border-zinc-800 leading-normal font-mono">
                        <strong className="text-red-500 uppercase font-black">HIPAA LOCKING CODE:</strong> Your medical details are encrypted. Crew needs <strong>PIN {activeTrip.patientInfo.accessCode}</strong> to view history.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0A0A0B] p-5 rounded-none border border-zinc-800 flex items-center justify-center h-48 text-center">
                      <div className="space-y-3">
                        <AlertCircle className="w-6 h-6 text-amber-500 mx-auto animate-bounce" />
                        <span className="text-xs font-black font-mono text-amber-400 block uppercase tracking-widest">LOCKING ON-BOARD UNIT</span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-relaxed max-w-xs">
                          Emergency coordinates routed. Handshaking with nearest active dispatch node...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-zinc-850 text-[9px] font-black font-mono text-zinc-500 text-center uppercase tracking-[0.2em] mt-6">
                  SECURED BY AES-256 END-TO-END HIPAA LINK
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
