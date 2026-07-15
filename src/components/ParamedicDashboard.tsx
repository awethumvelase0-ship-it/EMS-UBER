/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Activity, Shield, Lock, Unlock, Database, RefreshCw, 
  Wifi, WifiOff, FileText, Plus, Heart, ChevronRight, Sparkles 
} from "lucide-react";
import { Ambulance, DispatchTrip, TripStatus, MedicalCode, VitalSign } from "../types";

interface ParamedicDashboardProps {
  ambulances: Ambulance[];
  trips: DispatchTrip[];
  onUpdateTripStatus: (tripId: string, status: TripStatus, note: string) => Promise<void>;
  onUnlockPatient: (tripId: string, pin: string) => Promise<any>;
  onAddVitals: (tripId: string, vitals: any) => Promise<void>;
  onUpdateClinical: (tripId: string, clinical: any) => Promise<void>;
  onAddCode: (tripId: string, codeObj: MedicalCode) => Promise<void>;
  onSyncOfflineData: (queue: any[]) => Promise<void>;
}

export default function ParamedicDashboard({
  ambulances,
  trips,
  onUpdateTripStatus,
  onUnlockPatient,
  onAddVitals,
  onUpdateClinical,
  onAddCode,
  onSyncOfflineData
}: ParamedicDashboardProps) {
  // Paramedic vehicle assignment
  const [assignedAmbulanceId, setAssignedAmbulanceId] = useState("amb-101");
  const [pinInput, setPinInput] = useState("");
  const [unlockedPatient, setUnlockedPatient] = useState<any | null>(null);
  const [unlockError, setUnlockError] = useState("");
  const [loadingCodeSuggestions, setLoadingCodeSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<MedicalCode[]>([]);

  // Vitals inputs
  const [heartRate, setHeartRate] = useState("98");
  const [bloodPressure, setBloodPressure] = useState("125/82");
  const [spo2, setSpo2] = useState("97");
  const [temp, setTemp] = useState("98.6");

  // Clinical logs
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  // Offline Sync states
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Active Trip for current ambulance
  const activeTrip = trips.find(t => t.ambulanceId === assignedAmbulanceId && t.status !== "COMPLETED");

  // Pre-fill fields when active trip changes
  useEffect(() => {
    if (activeTrip) {
      setSymptoms(activeTrip.clinicalRecord.symptoms || "");
      setNotes(activeTrip.clinicalRecord.clinicalNotes || "");
      setUnlockedPatient(null); // lock again by default
      setPinInput("");
      setUnlockError("");
      setAiSuggestions([]);
    }
  }, [activeTrip]);

  const currentAmb = ambulances.find(a => a.id === assignedAmbulanceId);

  // Status transitions helper
  const handleStatusChange = async (newStatus: TripStatus, logNote: string) => {
    if (!activeTrip) return;
    if (isOffline) {
      // Queue offline status update
      const syncItem = {
        id: `sync-${Date.now()}`,
        action: "UPDATE_STATUS",
        payload: { tripId: activeTrip.id, status: newStatus, note: logNote }
      };
      setOfflineQueue(prev => [...prev, syncItem]);
      alert("Offline Mode: Status update queued locally.");
    } else {
      await onUpdateTripStatus(activeTrip.id, newStatus, logNote);
    }
  };

  // Submit PIN to unlock Patient HIPAA details
  const handleUnlock = async () => {
    if (!activeTrip) return;
    setUnlockError("");
    try {
      const res = await onUnlockPatient(activeTrip.id, pinInput);
      if (res && res.patientInfo) {
        setUnlockedPatient(res.patientInfo);
      } else {
        setUnlockError("Access Denied: Invalid Security Pin");
      }
    } catch (err: any) {
      setUnlockError(err.message || "Invalid Medical PIN");
    }
  };

  // Log new vitals readings
  const handleLogVitals = async () => {
    if (!activeTrip) return;
    const vitalsData = {
      heartRate: Number(heartRate),
      bloodPressure,
      spo2: Number(spo2),
      temperature: Number(temp)
    };

    if (isOffline) {
      const syncItem = {
        id: `sync-${Date.now()}`,
        action: "ADD_VITALS",
        payload: { tripId: activeTrip.id, vitals: vitalsData }
      };
      setOfflineQueue(prev => [...prev, syncItem]);
      alert("Offline Mode: Vitals logged to local cache queue.");
    } else {
      await onAddVitals(activeTrip.id, vitalsData);
    }
  };

  // Save clinical logs
  const handleSaveClinical = async () => {
    if (!activeTrip) return;
    if (isOffline) {
      const syncItem = {
        id: `sync-${Date.now()}`,
        action: "SAVE_CLINICAL",
        payload: { tripId: activeTrip.id, symptoms, clinicalNotes: notes }
      };
      setOfflineQueue(prev => [...prev, syncItem]);
      alert("Offline Mode: Clinical details queued locally.");
    } else {
      await onUpdateClinical(activeTrip.id, { symptoms, clinicalNotes: notes });
    }
  };

  // Request high-speed medical coding suggestions using server-side Gemini
  const fetchCodingSuggestions = async () => {
    if (!activeTrip) return;
    setLoadingCodeSuggestions(true);
    try {
      const res = await fetch("/api/gemini/suggest-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, symptoms })
      });
      const data = await res.json();
      setAiSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCodeSuggestions(false);
    }
  };

  const handleAddSuggestedCode = async (codeObj: MedicalCode) => {
    if (!activeTrip) return;
    await onAddCode(activeTrip.id, codeObj);
    // Remove from suggestions list
    setAiSuggestions(prev => prev.filter(c => c.code !== codeObj.code));
  };

  // Flush offline sync queue to server
  const triggerSync = async () => {
    if (offlineQueue.length === 0) return;
    try {
      await onSyncOfflineData(offlineQueue);
      setOfflineQueue([]);
      alert("Offline synchronization completed successfully! Server databases updated.");
    } catch (err) {
      console.error(err);
      alert("Sync failed. Check network link.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Cockpit Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
            <span>Paramedic Mobile Rescue Console</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">ASSIGNED CREW COCKPIT:</span>
            <select 
              value={assignedAmbulanceId} 
              onChange={(e) => setAssignedAmbulanceId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-teal-300 font-mono py-1 px-2 rounded focus:outline-none"
            >
              {ambulances.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Offline Toggle Hud */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
            isOffline ? "bg-red-950/40 text-red-400 border-red-950" : "bg-teal-950/40 text-teal-400 border-teal-950"
          }`}>
            {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>{isOffline ? "DISCONNECTED" : "SECURE LINK: LIVE"}</span>
          </div>

          <button 
            onClick={() => setIsOffline(!isOffline)}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-mono px-2.5 py-1.5 rounded"
          >
            {isOffline ? "Go Online" : "Simulate Offline"}
          </button>

          {offlineQueue.length > 0 && (
            <button 
              onClick={triggerSync}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-[10px] font-mono font-bold px-3 py-1.5 rounded flex items-center gap-1 animate-bounce"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sync Queue ({offlineQueue.length})</span>
            </button>
          )}
        </div>
      </div>

      {activeTrip ? (
        /* Active Trip Display */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dispatch Info & HIPAA Demographics Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400">DISPATCH ALIGNMENT</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  activeTrip.triageLevel === "RED" ? "bg-red-950 text-red-400 border-red-900" : "bg-amber-950 text-amber-400 border-amber-900"
                }`}>
                  {activeTrip.triageLevel}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block">DESTINATION INTAKE HOSPITAL:</span>
                <span className="text-sm font-bold text-slate-200">{activeTrip.destinationHospital}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block">CALLER CONTACT:</span>
                <span className="text-xs font-mono text-slate-300">{activeTrip.callerPhone}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block">INCIDENT PLACE:</span>
                <span className="text-xs text-slate-300">{activeTrip.locationName}</span>
              </div>

              {/* Patient HIPAA Secure Lockbox */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>HIPAA Patient Records Lockbox</span>
                  </span>
                  {unlockedPatient ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
                </div>

                {!unlockedPatient ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Patient information is encrypted. Enter the caller's secure 4-digit verification code to unlock full demographics and clinical history.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="PIN Code"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 w-24 text-center font-mono font-bold"
                      />
                      <button 
                        onClick={handleUnlock}
                        className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-3 py-1.5 rounded text-xs font-bold"
                      >
                        Authorize Unlock
                      </button>
                    </div>
                    {unlockError && <p className="text-[10px] text-red-400 font-mono">{unlockError}</p>}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs divide-y divide-slate-900 pt-1">
                    <div className="py-1 flex justify-between">
                      <span className="text-slate-400">Patient Name:</span>
                      <strong className="text-slate-100">{unlockedPatient.name}</strong>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="text-slate-400">Date of Birth:</span>
                      <strong className="text-slate-100 font-mono">{unlockedPatient.dob}</strong>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="text-slate-400">SSN Verified:</span>
                      <strong className="text-slate-100 font-mono">{unlockedPatient.ssnLocked}</strong>
                    </div>
                    <div className="py-1 flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <strong className="text-slate-100">{unlockedPatient.gender}</strong>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-400 block mb-1">Declared Medical History:</span>
                      <p className="bg-slate-900 p-2 rounded text-slate-300 font-sans text-[11px] leading-relaxed border border-slate-800">
                        {unlockedPatient.medicalHistory}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Status Command Actions */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-slate-400 block">MISSION MILESTONES:</span>
                
                {activeTrip.status === TripStatus.ON_ROUTE && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.AT_SCENE, "Paramedics reached patient scene")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>SIGNAL: ARRIVED AT SCENE</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {activeTrip.status === TripStatus.AT_SCENE && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.TRANSPORTING, `Transporting patient to ${activeTrip.destinationHospital}`)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>SIGNAL: BEGIN HOSPITAL TRANSPORT</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {activeTrip.status === TripStatus.TRANSPORTING && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.ARRIVED, "Patient delivered to hospital ER staff")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>SIGNAL: ARRIVED AT HOSPITAL</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {activeTrip.status === TripStatus.ARRIVED && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center text-xs text-slate-400 font-mono">
                    Awaiting Hospital Physician digital signature to complete clinical claims report.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Vitals & Telemetry Log Screen */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Vitals Telemetry Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Simulated On-Board Telemetry Logging</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">HEART RATE (BPM)</label>
                  <input 
                    type="number" 
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="bg-transparent text-xl font-mono text-red-400 font-bold focus:outline-none w-full"
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">BLOOD PRESSURE</label>
                  <input 
                    type="text" 
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="bg-transparent text-xl font-mono text-teal-400 font-bold focus:outline-none w-full"
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">OXYGEN (SPO2 %)</label>
                  <input 
                    type="number" 
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="bg-transparent text-xl font-mono text-teal-400 font-bold focus:outline-none w-full"
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <label className="text-[9px] font-mono text-slate-400 block mb-1">TEMP (&deg;F)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="bg-transparent text-xl font-mono text-amber-400 font-bold focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500">
                  Logs stream encrypted telemetry to the destination hospital intake portal in real time.
                </span>
                <button 
                  onClick={handleLogVitals}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded"
                >
                  Stream Log
                </button>
              </div>

              {/* Vitals History Sparkline Simulation */}
              {activeTrip.clinicalRecord.vitals.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500">Vitals Transmission History:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activeTrip.clinicalRecord.vitals.map((v, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 shrink-0">
                        <span className="block text-slate-500 text-[8px]">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        <div>HR: <strong className="text-red-400">{v.heartRate}</strong></div>
                        <div>BP: <strong className="text-teal-400">{v.bloodPressure}</strong></div>
                        <div>SpO2: <strong className="text-teal-300">{v.spo2}%</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clinical Logging & Fast Medical Coding AI */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Clinical Notes & Easy Medical Coding Assistant</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">PRESENTED SYMPTOMS</label>
                  <input 
                    type="text" 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-2 focus:border-teal-500 focus:outline-none"
                    placeholder="Describe main distress signs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">PARAMEDIC TREATMENT REMARKS</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-2 focus:border-teal-500 focus:outline-none"
                    placeholder="Administered saline, oxygen mask..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button 
                  onClick={handleSaveClinical}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded"
                >
                  Save Logs
                </button>
                <button 
                  onClick={fetchCodingSuggestions}
                  disabled={loadingCodeSuggestions}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{loadingCodeSuggestions ? "AI Coding..." : "Suggest Coding (Gemini)"}</span>
                </button>
              </div>

              {/* Gemini Suggested ICD-10 / CPT Codes List */}
              {aiSuggestions.length > 0 && (
                <div className="bg-teal-950/20 border border-teal-900/60 p-4 rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini Medical Coding Suggestions:</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiSuggestions.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleAddSuggestedCode(c)}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-teal-500/80 p-2.5 rounded-lg flex justify-between items-center cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-teal-300 bg-slate-900 px-1.5 py-0.5 rounded">
                              {c.code}
                            </span>
                            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-900">
                              {c.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300 block mt-1 leading-normal truncate max-w-xs">{c.description}</span>
                        </div>
                        <Plus className="w-4 h-4 text-teal-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already Assigned Codes */}
              {activeTrip.medicalCodes.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500">ASSIGNED BILLING CODES:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeTrip.medicalCodes.map((c, i) => (
                      <span key={i} className="text-[11px] font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300 flex items-center gap-1">
                        <strong className="text-teal-400 font-bold">{c.code}</strong>: {c.description} 
                        <span className="text-[9px] text-slate-500">({c.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        /* Idle state */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto my-12">
          <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-slate-300">Station Terminal: Standby Mode</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            No active emergency dispatch assigned to {currentAmb?.name || "selected ambulance"}. Wait for active callers to trigger panic alerts from the dispatcher center.
          </p>
        </div>
      )}
    </div>
  );
}
