/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Activity, Shield, Lock, Unlock, Database, RefreshCw, 
  Wifi, WifiOff, FileText, Plus, Heart, ChevronRight, Sparkles,
  MapPin, Wrench
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

  // Kilometers and Equipments
  const [kms, setKms] = useState<string>("8.5");
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [customEquipment, setCustomEquipment] = useState("");

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
      setKms(activeTrip.kilometersCovered?.toString() || "8.5");
      setSelectedEquipments(activeTrip.equipmentsUsed || []);
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
  const handleSaveClinical = async (overrideKms?: string, overrideEquipments?: string[]) => {
    if (!activeTrip) return;
    const finalKms = overrideKms !== undefined ? overrideKms : kms;
    const finalEquipments = overrideEquipments !== undefined ? overrideEquipments : selectedEquipments;

    if (isOffline) {
      const syncItem = {
        id: `sync-${Date.now()}`,
        action: "SAVE_CLINICAL",
        payload: { 
          tripId: activeTrip.id, 
          symptoms, 
          clinicalNotes: notes,
          kilometersCovered: Number(finalKms) || 0,
          equipmentsUsed: finalEquipments
        }
      };
      setOfflineQueue(prev => [...prev, syncItem]);
      alert("Offline Mode: Clinical details queued locally.");
    } else {
      await onUpdateClinical(activeTrip.id, { 
        symptoms, 
        clinicalNotes: notes,
        kilometersCovered: Number(finalKms) || 0,
        equipmentsUsed: finalEquipments
      });
    }
  };

  const handleToggleEquipment = (equipmentName: string) => {
    let updated: string[];
    if (selectedEquipments.includes(equipmentName)) {
      updated = selectedEquipments.filter(e => e !== equipmentName);
    } else {
      updated = [...selectedEquipments, equipmentName];
    }
    setSelectedEquipments(updated);
    handleSaveClinical(kms, updated);
  };

  const handleAddCustomEquipment = () => {
    if (!customEquipment.trim()) return;
    const name = customEquipment.trim();
    if (!selectedEquipments.includes(name)) {
      const updated = [...selectedEquipments, name];
      setSelectedEquipments(updated);
      handleSaveClinical(kms, updated);
    }
    setCustomEquipment("");
  };

  const handleKmsChange = (newVal: string) => {
    setKms(newVal);
    handleSaveClinical(newVal, selectedEquipments);
  };

  const handleAdjustKms = (amount: number) => {
    const current = parseFloat(kms) || 0;
    const nextVal = Math.max(0, current + amount).toFixed(1);
    setKms(nextVal);
    handleSaveClinical(nextVal, selectedEquipments);
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
      <div className="bg-white border border-zinc-200 rounded-none p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2 font-display uppercase tracking-widest">
            <Activity className="w-4 h-4 text-red-650 animate-pulse" />
            <span>PARAMEDIC MOBILE RESCUE CONSOLE</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 font-mono font-black uppercase tracking-wider">ASSIGNED CREW COCKPIT:</span>
            <select 
              value={assignedAmbulanceId} 
              onChange={(e) => setAssignedAmbulanceId(e.target.value)}
              className="bg-white border border-zinc-300 text-[11px] text-teal-700 font-mono font-bold py-1 px-2.5 rounded-none focus:outline-none"
            >
              {ambulances.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Offline Toggle Hud */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-[10px] font-mono font-black tracking-widest ${
            isOffline ? "bg-red-50 text-red-700 border-red-200" : "bg-teal-50 text-teal-700 border-teal-200"
          }`}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? "DISCONNECTED" : "SECURE LINK: LIVE"}</span>
          </div>

          <button 
            onClick={() => setIsOffline(!isOffline)}
            className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 text-[9px] font-mono font-black uppercase tracking-wider px-3 py-1.5 rounded-none transition-colors"
          >
            {isOffline ? "Go Online" : "Simulate Offline"}
          </button>

          {offlineQueue.length > 0 && (
            <button 
              onClick={triggerSync}
              className="bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-none flex items-center gap-1 animate-pulse border border-teal-600"
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
            <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">DISPATCH ALIGNMENT</span>
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-none border ${
                  activeTrip.triageLevel === "RED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {activeTrip.triageLevel}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono font-black text-zinc-550 block uppercase tracking-wider">DESTINATION INTAKE HOSPITAL:</span>
                <span className="text-xs font-black text-zinc-900 font-display uppercase tracking-wide">{activeTrip.destinationHospital}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono font-black text-zinc-550 block uppercase tracking-wider">CALLER CONTACT:</span>
                <span className="text-xs font-mono font-bold text-zinc-700">{activeTrip.callerPhone}</span>
              </div>

              <div>
                <span className="text-[9px] font-mono font-black text-zinc-550 block uppercase tracking-wider">INCIDENT PLACE:</span>
                <span className="text-xs text-zinc-700 font-mono font-bold uppercase">{activeTrip.locationName}</span>
              </div>

              {/* Patient HIPAA Secure Lockbox */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-none p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black text-blue-700 flex items-center gap-1.5 uppercase font-display tracking-wider">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>HIPAA SECURE LOCKBOX</span>
                  </span>
                  {unlockedPatient ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-500" />}
                </div>

                {!unlockedPatient ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-wider">
                      Patient information is encrypted. Enter the caller's secure 4-digit verification code to unlock full demographics and clinical history.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        className="bg-white border border-zinc-300 rounded-none px-2 py-1.5 text-xs text-zinc-900 w-24 text-center font-mono font-black focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleUnlock}
                        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-900 px-4 py-1.5 rounded-none text-[10px] font-black font-mono uppercase tracking-wider transition-colors"
                      >
                        Authorize
                      </button>
                    </div>
                    {unlockError && <p className="text-[10px] text-red-600 font-mono uppercase font-bold tracking-wider">{unlockError}</p>}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs divide-y divide-zinc-200 pt-1 font-mono">
                    <div className="py-1.5 flex justify-between">
                      <span className="text-zinc-550 uppercase tracking-wider text-[9px] font-black">Patient Name:</span>
                      <strong className="text-zinc-900 uppercase font-bold">{unlockedPatient.name}</strong>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-zinc-550 uppercase tracking-wider text-[9px] font-black">Date of Birth:</span>
                      <strong className="text-zinc-900 font-mono">{unlockedPatient.dob}</strong>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-zinc-550 uppercase tracking-wider text-[9px] font-black">SSN Verified:</span>
                      <strong className="text-zinc-900 font-mono">{unlockedPatient.ssnLocked}</strong>
                    </div>
                    <div className="py-1.5 flex justify-between">
                      <span className="text-zinc-550 uppercase tracking-wider text-[9px] font-black">Gender:</span>
                      <strong className="text-zinc-900 uppercase">{unlockedPatient.gender}</strong>
                    </div>
                    <div className="pt-2.5">
                      <span className="text-zinc-550 block mb-1 uppercase tracking-wider text-[9px] font-black">Declared Medical History:</span>
                      <p className="bg-white p-3 rounded-none text-zinc-800 font-mono text-[10px] leading-relaxed border border-zinc-200 uppercase tracking-wide">
                        {unlockedPatient.medicalHistory}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Status Command Actions */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-black text-zinc-500 block uppercase tracking-widest">MISSION MILESTONES:</span>
                
                {activeTrip.status === TripStatus.ON_ROUTE && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.AT_SCENE, "Paramedics reached patient scene")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black font-mono text-[10px] uppercase tracking-widest py-2.5 rounded-none flex items-center justify-center gap-1.5 transition-colors border border-amber-600"
                  >
                    <span>SIGNAL: ARRIVED AT SCENE</span>
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                )}

                {activeTrip.status === TripStatus.AT_SCENE && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.TRANSPORTING, `Transporting patient to ${activeTrip.destinationHospital}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black font-mono text-[10px] uppercase tracking-widest py-2.5 rounded-none flex items-center justify-center gap-1.5 transition-colors border border-blue-900"
                  >
                    <span>SIGNAL: BEGIN HOSPITAL TRANSPORT</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                )}

                {activeTrip.status === TripStatus.TRANSPORTING && (
                  <button 
                    onClick={() => handleStatusChange(TripStatus.ARRIVED, "Patient delivered to hospital ER staff")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black font-mono text-[10px] uppercase tracking-widest py-2.5 rounded-none flex items-center justify-center gap-1.5 transition-colors border border-emerald-900"
                  >
                    <span>SIGNAL: ARRIVED AT HOSPITAL</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                )}

                {activeTrip.status === TripStatus.ARRIVED && (
                  <div className="bg-zinc-50 p-3 rounded-none border border-zinc-200 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-wider leading-relaxed">
                    Awaiting Hospital Physician digital signature to complete clinical claims report.
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Vitals & Telemetry Log Screen */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Vitals Telemetry Panel */}
            <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                <Heart className="w-4 h-4 text-red-650 animate-pulse" />
                <span>ON-BOARD TELEMETRY MONITORING</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">HEART RATE (BPM)</label>
                  <input 
                    type="number" 
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="bg-transparent text-2xl font-mono text-red-600 font-black focus:outline-none w-full"
                  />
                </div>
                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">BLOOD PRESSURE</label>
                  <input 
                    type="text" 
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="bg-transparent text-2xl font-mono text-teal-600 font-black focus:outline-none w-full"
                  />
                </div>
                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">OXYGEN (SPO2 %)</label>
                  <input 
                    type="number" 
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="bg-transparent text-2xl font-mono text-teal-600 font-black focus:outline-none w-full"
                  />
                </div>
                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">TEMP (&deg;F)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="bg-transparent text-2xl font-mono text-amber-600 font-black focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-between items-center pt-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-normal max-w-sm">
                  Encrypted telemetry streams directly to destination hospital ER intake portals.
                </span>
                <button 
                  onClick={handleLogVitals}
                  className="bg-teal-655 hover:bg-teal-700 text-white font-black font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-teal-650 rounded-none transition-colors"
                >
                  Stream Log
                </button>
              </div>

              {/* Vitals History Sparkline Simulation */}
              {activeTrip.clinicalRecord.vitals.length > 0 && (
                <div className="bg-zinc-50 p-3.5 rounded-none border border-zinc-200 space-y-2">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-wider block">Telemetry Transmission Logs:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activeTrip.clinicalRecord.vitals.map((v, i) => (
                      <div key={i} className="bg-white border border-zinc-200 rounded-none p-2.5 text-[10px] font-mono text-zinc-750 shrink-0 shadow-2xs">
                        <span className="block text-zinc-500 text-[8px] font-black mb-1">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        <div>HR: <strong className="text-red-650 font-black">{v.heartRate}</strong></div>
                        <div>BP: <strong className="text-teal-600 font-black">{v.bloodPressure}</strong></div>
                        <div>SpO2: <strong className="text-teal-650 font-black">{v.spo2}%</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clinical Logging & Fast Medical Coding AI */}
            <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2 font-display">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>CLINICAL REPORT & EASY CODING</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">PRESENTED SYMPTOMS</label>
                  <input 
                    type="text" 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-none text-xs text-zinc-800 p-2.5 focus:border-teal-500 focus:outline-none font-bold"
                    placeholder="E.g., chest pain, shortness of breath"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">PARAMEDIC TREATMENT REMARKS</label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-none text-xs text-zinc-800 p-2.5 focus:border-teal-500 focus:outline-none font-bold"
                    placeholder="E.g., administered saline, oxygen face mask"
                  />
                </div>
              </div>

              {/* Kilometers and Equipments Integration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-150 pt-4">
                {/* Kilometers Covered */}
                <div className="md:col-span-1 space-y-2">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>TRIP DISTANCE COVERED</span>
                  </label>
                  <div className="flex rounded-none border border-zinc-300 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => handleAdjustKms(-1)}
                      className="px-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-black text-[10px] font-mono border-r border-zinc-200"
                    >
                      -1.0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustKms(-0.1)}
                      className="px-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 font-black text-[9px] font-mono border-r border-zinc-200"
                    >
                      -0.1
                    </button>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={kms}
                      onChange={(e) => handleKmsChange(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="w-full text-center text-xs font-mono font-black text-teal-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustKms(0.1)}
                      className="px-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 font-black text-[9px] font-mono border-l border-zinc-200"
                    >
                      +0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustKms(1)}
                      className="px-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-black text-[10px] font-mono border-l border-zinc-200"
                    >
                      +1.0
                    </button>
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
                    * Billable ambulance travel distance in kilometers. Updates are synced to billing automatically.
                  </div>
                </div>

                {/* Equipments Used Portal */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[9px] font-mono font-black text-zinc-500 block uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-teal-600" />
                    <span>EQUIPMENTS USED PORTAL</span>
                  </label>
                  
                  {/* Equipment grid checkboxes */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto border border-zinc-200 p-2 bg-zinc-50/50">
                    {[
                      "Cardiac Monitor / Defibrillator",
                      "Intravenous (IV) Therapy Kit",
                      "Oxygen Supply (High-Flow)",
                      "Bag Valve Mask (BVM)",
                      "Advanced Airway (Intubation Kit)",
                      "Spinal Immobilization Board",
                      "Suction Unit & Catheter",
                      "Orthopedic Splints",
                      "Epinephrine Auto-Injector",
                      "Nebulizer Therapy"
                    ].map((eq) => {
                      const isUsed = selectedEquipments.includes(eq);
                      return (
                        <button
                          type="button"
                          key={eq}
                          onClick={() => handleToggleEquipment(eq)}
                          className={`text-left text-[9px] font-mono px-2 py-1.5 border transition-all flex items-center justify-between ${
                            isUsed
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-black"
                              : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                          }`}
                        >
                          <span className="truncate pr-1 uppercase">{eq}</span>
                          <span className={`w-2.5 h-2.5 rounded-full border ${isUsed ? "bg-emerald-500 border-emerald-600" : "bg-transparent border-zinc-300"}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Equipment input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter custom equipment..."
                      value={customEquipment}
                      onChange={(e) => setCustomEquipment(e.target.value)}
                      className="bg-white border border-zinc-300 text-[10px] px-2.5 py-1 focus:outline-none focus:border-teal-500 flex-1 font-mono uppercase font-bold"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomEquipment();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEquipment}
                      className="bg-zinc-800 hover:bg-zinc-900 text-white font-mono text-[9px] font-black uppercase tracking-wider px-3 py-1 transition-colors border border-zinc-900"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button 
                  onClick={handleSaveClinical}
                  className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 rounded-none transition-colors"
                >
                  Save Logs
                </button>
                <button 
                  onClick={fetchCodingSuggestions}
                  disabled={loadingCodeSuggestions}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-black font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-teal-650 rounded-none flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>{loadingCodeSuggestions ? "Coding..." : "Suggest Codes (Gemini)"}</span>
                </button>
              </div>

              {/* Gemini Suggested ICD-10 / CPT Codes List */}
              {aiSuggestions.length > 0 && (
                <div className="bg-teal-50/50 border border-teal-200 p-4 rounded-none space-y-3">
                  <h4 className="text-xs font-black text-teal-800 flex items-center gap-1.5 uppercase font-display tracking-wider">
                    <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span>Gemini Medical Coding Suggestions:</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {aiSuggestions.map((c, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleAddSuggestedCode(c)}
                        className="bg-white hover:bg-zinc-50 border border-zinc-250 hover:border-teal-500/80 p-3 rounded-none flex justify-between items-center cursor-pointer transition-all shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-black text-teal-700 bg-teal-100/60 border border-teal-200">
                              {c.code}
                            </span>
                            <span className="text-[8px] font-mono font-black px-1 py-0.2 rounded bg-zinc-100 text-zinc-650 border border-zinc-200 uppercase">
                              {c.type}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-zinc-800 block mt-1.5 leading-normal truncate">{c.description}</span>
                        </div>
                        <Plus className="w-4 h-4 text-teal-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Already Assigned Codes */}
              {activeTrip.medicalCodes.length > 0 && (
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 space-y-2">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block">ASSIGNED CLINICAL BILLING CODES:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeTrip.medicalCodes.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono bg-white border border-zinc-200 px-3 py-1.5 rounded-none text-zinc-800 flex items-center gap-1.5 shadow-2xs">
                        <strong className="text-teal-700 font-black">{c.code}</strong>: <span className="font-bold uppercase text-[9px] text-zinc-700">{c.description}</span>
                        <span className="text-[8px] font-black text-zinc-400 uppercase">({c.type})</span>
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
        <div className="bg-white border border-zinc-200 rounded-none p-10 text-center max-w-2xl mx-auto my-12 shadow-md">
          <Activity className="w-10 h-10 text-zinc-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] font-display">STATION TERMINAL: STANDBY</h3>
          <p className="text-zinc-600 font-mono text-[10px] mt-2 leading-relaxed uppercase tracking-widest">
            No active emergency dispatch is assigned to {currentAmb?.name || "selected ambulance"}. Wait for active callers to trigger panic alerts from the dispatcher center.
          </p>
        </div>
      )}
    </div>
  );
}
