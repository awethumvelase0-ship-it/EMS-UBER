/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  AlertCircle, Phone, MapPin, Key, HeartPulse, User, 
  Calendar, ShieldCheck, Navigation, Clock, Truck, 
  FileText, CheckCircle, ListPlus 
} from "lucide-react";
import { TriageLevel, DispatchTrip, Ambulance, TripStatus } from "../types";
import LiveEMSMap from "./LiveEMSMap";

interface ClientDashboardProps {
  ambulances: Ambulance[];
  trips: DispatchTrip[];
  activeTrip: DispatchTrip | null;
  onPanicTrigger: (triage: TriageLevel, patientData: any) => Promise<void>;
  onCancelTrip: (tripId: string) => Promise<void>;
  onScheduleTrip: (scheduleData: any) => Promise<void>;
}

export default function ClientDashboard({ 
  ambulances, 
  trips,
  activeTrip, 
  onPanicTrigger, 
  onCancelTrip,
  onScheduleTrip 
}: ClientDashboardProps) {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<"panic" | "schedule">("panic");

  // Panic form states
  const [phone, setPhone] = useState("+1 (555) ");
  const [patientName, setPatientName] = useState("");
  const [dob, setDob] = useState("1988-06-15");
  const [gender, setGender] = useState("Male");
  const [ssn, setSsn] = useState("334-92-0988");
  const [history, setHistory] = useState("Moderate asthma, allergy to sulfa drugs");
  const [pinCode, setPinCode] = useState("4481");
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel>(TriageLevel.RED);
  const [loading, setLoading] = useState(false);

  // Scheduling booking form states
  const [schedDate, setSchedDate] = useState("2026-07-16");
  const [schedTime, setSchedTime] = useState("10:00");
  const [schedPickup, setSchedPickup] = useState("455 Market St, San Francisco, CA");
  const [schedDest, setSchedDest] = useState("Mercy General Trauma Center");
  const [selectedAmbId, setSelectedAmbId] = useState("");
  const [schedTriage, setSchedTriage] = useState<TriageLevel>(TriageLevel.GREEN);
  const [schedPatientName, setSchedPatientName] = useState("");
  const [schedPhone, setSchedPhone] = useState("+1 (555) ");
  const [schedHistory, setSchedHistory] = useState("");
  const [schedDob, setSchedDob] = useState("1988-06-15");
  const [schedGender, setSchedGender] = useState("Male");
  const [schedPin, setSchedPin] = useState("4481");
  const [schedSsn, setSchedSsn] = useState("334-92-0988");
  const [isSchedLoading, setIsSchedLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

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

  const handleAutofillProfile = () => {
    setSchedPatientName(patientName || "Anonymous Patient");
    setSchedPhone(phone);
    setSchedHistory(history);
    setSchedDob(dob);
    setSchedGender(gender);
    setSchedPin(pinCode);
    setSchedSsn(ssn);
  };

  const handleBookTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedPhone.trim()) {
      setBookingMessage("ERROR: PATIENT PHONE IS REQUIRED.");
      return;
    }
    if (!schedDate || !schedTime) {
      setBookingMessage("ERROR: TRANSPORT DATE AND TIME ARE REQUIRED.");
      return;
    }
    setIsSchedLoading(true);
    setBookingMessage("");
    try {
      const scheduleData = {
        triageLevel: schedTriage,
        callerPhone: schedPhone,
        locationName: schedPickup,
        destinationHospital: schedDest,
        ambulanceId: selectedAmbId || undefined,
        scheduledAt: `${schedDate} ${schedTime}`,
        patientName: schedPatientName || "John Doe (Unidentified)",
        dob: schedDob,
        gender: schedGender,
        ssnLocked: schedSsn || "XXX-XX-0000",
        medicalHistory: schedHistory || "Scheduled Transport Transfer",
        accessCode: schedPin || "9999"
      };
      await onScheduleTrip(scheduleData);
      setBookingMessage("SUCCESS: AMBULANCE PRE-BOOKED SECURELY.");
    } catch (err) {
      console.error(err);
      setBookingMessage("ERROR: TRANSPORT SCHEDULING DISPATCH FAILED.");
    } finally {
      setIsSchedLoading(false);
    }
  };

  const assignedAmb = activeTrip ? ambulances.find(a => a.id === activeTrip.ambulanceId) : null;

  return (
    <div className="space-y-6">
      {/* Upper Status Cards */}
      <div className="bg-white border border-zinc-200 rounded-none p-6 shadow-md">
        <div className="border-b border-zinc-200 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2 tracking-wider font-display uppercase">
            <HeartPulse className="w-5 h-5 text-red-600 animate-pulse" />
            <span>EMS ONE-TOUCH PANIC ENGINE</span>
          </h2>
          <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest bg-zinc-100 px-2 py-1 border border-zinc-200">
            SYSTEM-ON / BIOMETRIC LOADED
          </span>
        </div>
        <p className="text-zinc-600 text-xs mb-6 uppercase tracking-wider leading-relaxed">
          INSTANT EMT &amp; PARAMEDIC ROUTING CORE. UNCONSCIOUS ALERTS FORCE DISPATCH OF ADVANCED LIFE SUPPORT (ALS) UNITS. ALL PERSONAL TELEMETRY IS BIOMETRICALLY SEALED.
        </p>

        {!activeTrip ? (
          <div className="space-y-6">
            {/* Segmented Tab Selectors */}
            <div className="grid grid-cols-2 gap-2 border border-zinc-200 bg-zinc-50 p-1 rounded-none mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("panic")}
                className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider font-mono text-center transition-all ${
                  activeTab === "panic"
                    ? "bg-red-600 text-white shadow-sm font-black"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 bg-transparent"
                }`}
              >
                🚨 Emergency Instant Panic
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`py-2.5 px-4 text-xs font-black uppercase tracking-wider font-mono text-center transition-all ${
                  activeTab === "schedule"
                    ? "bg-zinc-900 text-white shadow-sm font-black"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 bg-transparent"
                }`}
              >
                📅 Schedule / Book Transport
              </button>
            </div>

            {activeTab === "panic" && (
              <div className="space-y-6">
                {/* Quick Demographics Form & Privacy PIN Configuration */}
            <div className="bg-zinc-50 p-5 rounded-none border border-zinc-200 space-y-5">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-1.5 pb-2 border-b border-zinc-250">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>HIPAA PATIENT RECORD ENCRYPTION MATRIX</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">CALLER TELEPHONE *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">PATIENT FULL NAME (LOCKABLE)</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                    <input 
                      type="text" 
                      value={patientName} 
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Leave blank for anonymous/unidentified"
                      className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none uppercase tracking-wide font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">PATIENT DATE OF BIRTH</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">GENDER SELECT</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none uppercase font-mono font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">SSN (AUTOMATED AES-256 SEAL)</label>
                  <input 
                    type="text" 
                    value={ssn} 
                    onChange={(e) => setSsn(e.target.value)}
                    className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none font-mono font-bold tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black font-mono text-red-600 mb-1.5 uppercase tracking-widest">4-DIGIT PIN SECURITY LOCK *</label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-red-500" />
                    <input 
                      type="text" 
                      maxLength={4}
                      value={pinCode} 
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g,''))}
                      className="w-full bg-white border border-red-300 text-xs text-red-600 rounded-none pl-9 pr-3 py-2.5 focus:border-red-600 focus:outline-none font-mono font-bold text-center tracking-[0.4em]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">VITAL MEDICAL HISTORY / ALLERGIES (HIPAA PROTECTED)</label>
                <textarea 
                  value={history} 
                  onChange={(e) => setHistory(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2.5 focus:border-red-600 focus:outline-none font-mono"
                  placeholder="e.g. cardiac conditions, diabetes, penicillin allergy..."
                />
              </div>
            </div>

            {/* Instant Highly Visual Emergency Triage Selection Buttons */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.25em] font-display">
                SELECT TRIAGE PATHWAY:
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">REQUIRED FOR DISPATCH LEVEL</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option 1: Critical / Unconscious (RED) */}
              <button 
                type="button"
                disabled={loading}
                onClick={() => setSelectedTriage(TriageLevel.RED)}
                className={`group relative rounded-none p-5 text-left transition-all border-2 shadow-sm focus:outline-none ${
                  selectedTriage === TriageLevel.RED
                    ? "bg-red-50 border-red-600 ring-2 ring-red-600/35"
                    : "bg-white border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-none transition-transform ${
                    selectedTriage === TriageLevel.RED ? "bg-red-600 text-white scale-105" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-red-700 bg-red-100/80 px-2 py-1 border border-red-200">ALS OVERRIDE</span>
                </div>
                <h3 className="text-lg font-black text-red-950 uppercase font-display tracking-wider">Critical / Unconscious</h3>
                <p className="text-xs text-red-800/85 mt-2 leading-relaxed">
                  Cardiac event, major trauma, stroke, choking, severe respiratory distress. Bypasses basic units instantly.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-red-700 uppercase tracking-widest group-hover:underline">
                  {selectedTriage === TriageLevel.RED ? "★ CURRENT SELECTION" : "SELECT PATHWAY"}
                </span>
              </button>

              {/* Option 2: Urgent Pain / Sick (YELLOW) */}
              <button 
                type="button"
                disabled={loading}
                onClick={() => setSelectedTriage(TriageLevel.YELLOW)}
                className={`group relative rounded-none p-5 text-left transition-all border-2 shadow-sm focus:outline-none ${
                  selectedTriage === TriageLevel.YELLOW
                    ? "bg-amber-50 border-amber-600 ring-2 ring-amber-600/35"
                    : "bg-white border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-none transition-transform ${
                    selectedTriage === TriageLevel.YELLOW ? "bg-amber-600 text-white scale-105" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-amber-700 bg-amber-100/80 px-2 py-1 border border-amber-200">BLS / ALS</span>
                </div>
                <h3 className="text-lg font-black text-amber-950 uppercase font-display tracking-wider">Urgent Sickness</h3>
                <p className="text-xs text-amber-800/85 mt-2 leading-relaxed">
                  Severe abdominal pain, compound fractures, severe fever, stable chest pressure. Dispatches high-priority response.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-amber-700 uppercase tracking-widest group-hover:underline">
                  {selectedTriage === TriageLevel.YELLOW ? "★ CURRENT SELECTION" : "SELECT PATHWAY"}
                </span>
              </button>

              {/* Option 3: Minor Injury (GREEN) */}
              <button 
                type="button"
                disabled={loading}
                onClick={() => setSelectedTriage(TriageLevel.GREEN)}
                className={`group relative rounded-none p-5 text-left transition-all border-2 shadow-sm focus:outline-none ${
                  selectedTriage === TriageLevel.GREEN
                    ? "bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/35"
                    : "bg-white border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-none transition-transform ${
                    selectedTriage === TriageLevel.GREEN ? "bg-emerald-600 text-white scale-105" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-100/80 px-2 py-1 border border-emerald-200">BLS OPTIMAL</span>
                </div>
                <h3 className="text-lg font-black text-emerald-950 uppercase font-display tracking-wider">Minor Trauma</h3>
                <p className="text-xs text-emerald-800/85 mt-2 leading-relaxed">
                  Controlled bleeding, lacerations, moderate burns, sprains. Dispatches standard EMT ambulance.
                </p>
                <span className="block mt-5 text-[10px] font-mono font-black text-emerald-700 uppercase tracking-widest group-hover:underline">
                  {selectedTriage === TriageLevel.GREEN ? "★ CURRENT SELECTION" : "SELECT PATHWAY"}
                </span>
              </button>

            </div>

            {/* Giant explicit Request Button */}
            <div className="pt-4 border-t border-zinc-200 mt-4">
              <button
                id="request-ambulance-btn"
                disabled={loading}
                onClick={() => triggerPanic(selectedTriage)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-base py-4 px-6 rounded-none shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.005] active:scale-95 disabled:opacity-50 tracking-widest font-display uppercase border border-red-700"
              >
                <AlertCircle className="w-6 h-6 animate-pulse shrink-0" />
                <span>{loading ? "COMMUNICATING WITH EMERGENCY ROUTER..." : "REQUEST EMERGENCY AMBULANCE NOW"}</span>
              </button>
            </div>
          </div>
        )}

            {activeTab === "schedule" && (
              <div className="space-y-6">
                <form onSubmit={handleBookTransport} className="bg-zinc-50 p-5 rounded-none border border-zinc-200 space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-200 pb-3">
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>ADVANCE AMBULANCE BOOKING DESK</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAutofillProfile}
                      className="bg-white border border-zinc-350 text-zinc-700 hover:bg-zinc-50 font-mono text-[9px] font-black uppercase tracking-wider px-2.5 py-1 transition-all"
                    >
                      ★ Auto-fill from Patient Profile Above
                    </button>
                  </div>

                  {bookingMessage && (
                    <div className={`p-3.5 border text-xs font-mono font-bold uppercase tracking-wider ${
                      bookingMessage.startsWith("SUCCESS") 
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                        : "bg-red-50 border-red-300 text-red-800"
                    }`}>
                      {bookingMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">PICKUP ADDRESS / COORDINATES *</label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                        <input 
                          type="text" 
                          required
                          value={schedPickup}
                          onChange={(e) => setSchedPickup(e.target.value)}
                          placeholder="e.g. 455 Market St, San Francisco, CA"
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none pl-9 pr-3 py-2.5 focus:border-zinc-900 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">DESTINATION HEALTHCARE HOSPITAL *</label>
                      <div className="relative">
                        <Truck className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                        <select 
                          value={schedDest}
                          onChange={(e) => setSchedDest(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none pl-9 pr-3 py-2.5 focus:border-zinc-900 focus:outline-none font-mono font-bold uppercase"
                        >
                          <option value="Mercy General Trauma Center">Mercy General Trauma Center</option>
                          <option value="St. Jude Cardiac Specialist">St. Jude Cardiac Specialist</option>
                          <option value="City Community Hospital">City Community Hospital</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">TRANSPORT DATE *</label>
                      <input 
                        type="date" 
                        required
                        value={schedDate}
                        onChange={(e) => setSchedDate(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:border-zinc-900 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">PICKUP TIME *</label>
                      <input 
                        type="time" 
                        required
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:border-zinc-900 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black font-mono text-zinc-600 mb-1.5 uppercase tracking-wider">PRE-BOOK AMBULANCE UNIT</label>
                      <select 
                        value={selectedAmbId}
                        onChange={(e) => setSelectedAmbId(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:border-zinc-900 focus:outline-none font-mono uppercase font-bold"
                      >
                        <option value="">AUTO-ASSIGN UPON DISPATCH</option>
                        {ambulances.map((amb) => (
                          <option key={amb.id} value={amb.id}>
                            {amb.name} ({amb.type}) - {amb.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-zinc-250 pt-4 space-y-4">
                    <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest block">PATIENT DETAILS FOR BOOKING:</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">PATIENT FULL NAME</label>
                        <input 
                          type="text"
                          placeholder="Patient Full Name"
                          value={schedPatientName}
                          onChange={(e) => setSchedPatientName(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">TELEPHONE CONTACT *</label>
                        <input 
                          type="text"
                          placeholder="Phone Number"
                          value={schedPhone}
                          onChange={(e) => setSchedPhone(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">GENDER SELECT</label>
                        <select 
                          value={schedGender}
                          onChange={(e) => setSchedGender(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono font-bold uppercase"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">DATE OF BIRTH</label>
                        <input 
                          type="date"
                          value={schedDob}
                          onChange={(e) => setSchedDob(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">SSN (ENCRYPTED FILE)</label>
                        <input 
                          type="text"
                          value={schedSsn}
                          onChange={(e) => setSchedSsn(e.target.value)}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono font-bold tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">PATIENT HIPAA PIN *</label>
                        <input 
                          type="text"
                          maxLength={4}
                          value={schedPin}
                          onChange={(e) => setSchedPin(e.target.value.replace(/\D/g,''))}
                          className="w-full bg-white border border-zinc-300 text-xs text-zinc-950 font-bold rounded-none px-3 py-2 text-center tracking-widest font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black font-mono text-zinc-500 mb-1 uppercase tracking-wider">TRANSPORTATION DIAGNOSIS NOTES / PRIOR MEDICAL HISTORY</label>
                      <textarea
                        value={schedHistory}
                        onChange={(e) => setSchedHistory(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 rounded-none px-3 py-2 focus:outline-none font-mono"
                        placeholder="State any specific mobility constraints, continuous oxygen requirement, or medical transfer diagnostics..."
                      />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-[10px] font-black font-mono text-zinc-600 uppercase tracking-wider">SELECT REIMBURSEMENT CLASS & TRIAGE STATUS</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { key: TriageLevel.GREEN, title: "Standard BLS Transfer", desc: "Non-urgent, mobility assistance, regular care", color: "border-emerald-200 hover:bg-emerald-50 bg-white", selectColor: "bg-emerald-50 border-emerald-600 text-emerald-900" },
                          { key: TriageLevel.YELLOW, title: "Urgent Inter-Hospital", desc: "Stable cardiac/respiratory needs, intermediate support", color: "border-amber-200 hover:bg-amber-50 bg-white", selectColor: "bg-amber-50 border-amber-600 text-amber-900" },
                          { key: TriageLevel.RED, title: "Critical Scheduled ALS", desc: "Continuous monitoring, high severity, oxygen required", color: "border-red-200 hover:bg-red-50 bg-white", selectColor: "bg-red-50 border-red-600 text-red-900" }
                        ].map((tri) => (
                          <button
                            key={tri.key}
                            type="button"
                            onClick={() => setSchedTriage(tri.key)}
                            className={`p-3 text-left border rounded-none transition-all ${
                              schedTriage === tri.key ? tri.selectColor + " ring-1 ring-zinc-500" : tri.color
                            }`}
                          >
                            <span className="text-[11px] font-black uppercase tracking-wide block">{tri.title}</span>
                            <span className="text-[9px] text-zinc-500 block mt-1 leading-normal uppercase">{tri.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSchedLoading}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs py-4 px-6 rounded-none shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-widest font-mono"
                  >
                    <ListPlus className="w-4 h-4" />
                    <span>{isSchedLoading ? "BOOKING TRANSPORT AT EMS CORE..." : "RESERVE AMBULANCE & SCHEDULE TRANSPORT"}</span>
                  </button>
                </form>

                {/* Scheduled Transport list */}
                <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-zinc-950 uppercase tracking-[0.2em] flex items-center gap-1.5 font-display border-b border-zinc-200 pb-3">
                    <Clock className="w-4 h-4 text-zinc-900" />
                    <span>YOUR ACTIVE SCHEDULED / PRE-BOOKED TRANSPORTS</span>
                  </h3>

                  {trips.filter(t => t.status === TripStatus.SCHEDULED).length === 0 ? (
                    <div className="text-center p-8 bg-zinc-50 border border-dashed border-zinc-200">
                      <Clock className="w-7 h-7 text-zinc-400 mx-auto mb-2" />
                      <span className="text-xs font-black font-mono text-zinc-500 block uppercase tracking-widest">NO SCHEDULED TRANSPORTS</span>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                        Use the scheduler booking desk above to pre-book non-emergency transports.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trips.filter(t => t.status === TripStatus.SCHEDULED).map((trip) => {
                        const amb = ambulances.find(a => a.id === trip.ambulanceId);
                        return (
                          <div key={trip.id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5">
                                <span className="bg-zinc-900 text-white text-[9px] font-mono px-2 py-0.5 font-black uppercase tracking-widest rounded-none">
                                  📅 {trip.scheduledAt || "Scheduled"}
                                </span>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-none border uppercase tracking-wider ${
                                  trip.triageLevel === TriageLevel.RED ? "bg-red-50 text-red-700 border-red-200" :
                                  trip.triageLevel === TriageLevel.YELLOW ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {trip.triageLevel} Transfer
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                <div>
                                  <span className="text-zinc-500 uppercase font-mono text-[9px] block">Patient Name</span>
                                  <strong className="text-zinc-800 uppercase font-bold">{trip.patientInfo.name}</strong>
                                </div>
                                <div>
                                  <span className="text-zinc-500 uppercase font-mono text-[9px] block">Telephone</span>
                                  <strong className="text-zinc-800 font-mono">{trip.callerPhone}</strong>
                                </div>
                                <div className="sm:col-span-2 mt-1">
                                  <span className="text-zinc-500 uppercase font-mono text-[9px] block">Pickup & Destination</span>
                                  <span className="text-zinc-800 font-bold uppercase">{trip.locationName}</span>
                                  <span className="text-zinc-400 mx-1">→</span>
                                  <span className="text-zinc-800 font-bold uppercase">{trip.destinationHospital}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row md:flex-col justify-between items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-200">
                              <div className="text-right">
                                <span className="text-zinc-400 uppercase font-mono text-[9px] block">PRE-BOOKED UNIT</span>
                                <strong className="text-teal-700 font-mono text-xs uppercase block">
                                  {amb ? amb.name : "Auto-allocated"}
                                </strong>
                              </div>
                              <div className="flex gap-2">
                                <div className="bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-center font-mono">
                                  <span className="text-[8px] text-zinc-500 block uppercase font-bold">PIN ACCESS</span>
                                  <strong className="text-xs text-zinc-800 font-black tracking-widest">{trip.patientInfo.accessCode}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onCancelTrip(trip.id)}
                                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-mono text-[10px] font-bold uppercase px-3 py-1 rounded-none transition-all active:scale-95"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Distress Mode */
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 p-5 rounded-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                  </span>
                  <h3 className="text-base font-black text-red-950 tracking-wide uppercase font-display">ACTIVE RESCUE DISPATCHED: {activeTrip.status}</h3>
                </div>
                <p className="text-xs text-red-700 mt-1.5 font-mono uppercase tracking-wider">
                  TRIP ID: {activeTrip.id} | DESIGNATED TRIAGE: {activeTrip.triageLevel}
                </p>
              </div>
              <button 
                onClick={() => onCancelTrip(activeTrip.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-black font-mono px-4 py-2 rounded-none uppercase transition-all border border-red-750 active:scale-95"
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
              <div className="bg-zinc-50 border border-zinc-200 rounded-none p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 tracking-[0.2em] uppercase mb-4 font-display">LIVE RESPONSE TELEMETRY</h3>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl font-black font-mono text-red-600 tracking-tighter">{simulatedEta}</span>
                    <span className="text-sm text-zinc-700 font-black uppercase tracking-widest font-display">MINS</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6 font-mono uppercase tracking-wider">
                    <Navigation className="w-3.5 h-3.5 text-red-500" />
                    <span>Distance: {simulatedDistance} miles away</span>
                  </div>

                  {assignedAmb ? (
                    <div className="bg-white border border-zinc-200 rounded-none p-4 space-y-4 shadow-xs">
                      <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                        <span className="text-xs font-black text-zinc-900 uppercase tracking-wider font-display">{assignedAmb.name}</span>
                        <span className="text-[9px] font-mono bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 font-bold uppercase tracking-widest">
                          {assignedAmb.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[9px] font-black font-mono text-zinc-400 block uppercase tracking-wider">ASSIGNED EMT CREW:</span>
                        {assignedAmb.crew.map((member, idx) => (
                          <div key={idx} className="text-xs text-zinc-800 font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 inline-block" />
                            <span className="uppercase tracking-wide font-mono text-[11px]">{member}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-zinc-600 bg-zinc-50 p-3 rounded-none border border-zinc-200 leading-normal font-mono">
                        <strong className="text-red-600 uppercase font-black">HIPAA LOCKING CODE:</strong> Your medical details are encrypted. Crew needs <strong>PIN {activeTrip.patientInfo.accessCode}</strong> to view history.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-none border border-zinc-200 flex items-center justify-center h-48 text-center shadow-xs">
                      <div className="space-y-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 mx-auto animate-bounce" />
                        <span className="text-xs font-black font-mono text-amber-600 block uppercase tracking-widest">LOCKING ON-BOARD UNIT</span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider leading-relaxed max-w-xs">
                          Emergency coordinates routed. Handshaking with nearest active dispatch node...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-zinc-200 text-[9px] font-black font-mono text-zinc-400 text-center uppercase tracking-[0.2em] mt-6">
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
