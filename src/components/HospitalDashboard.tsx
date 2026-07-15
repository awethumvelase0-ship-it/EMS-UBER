/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { 
  Hospital, Activity, Heart, ShieldAlert, Key, 
  PenTool, FileCheck, CheckCircle2, RefreshCcw 
} from "lucide-react";
import { DispatchTrip, Ambulance, TripStatus, UserRole } from "../types";

interface HospitalDashboardProps {
  trips: DispatchTrip[];
  ambulances: Ambulance[];
  onUnlockPatient: (tripId: string, pin: string) => Promise<any>;
  onDoctorSignOff: (tripId: string, doctorData: { doctorName: string; licenseNumber: string }) => Promise<void>;
}

export default function HospitalDashboard({
  trips,
  ambulances,
  onUnlockPatient,
  onDoctorSignOff
}: HospitalDashboardProps) {
  const [selectedHospitalName, setSelectedHospitalName] = useState("Mercy General Trauma Center");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [unlockedPatient, setUnlockedPatient] = useState<any | null>(null);
  const [unlockError, setUnlockError] = useState("");

  // Doctor Sign Off details
  const [doctorName, setDoctorName] = useState("Dr. Gregory House");
  const [licenseNumber, setLicenseNumber] = useState("MD-991208");
  const [signing, setSigning] = useState(false);

  // Filter incoming trips for selected hospital (not completed, or completed recently)
  const incomingTrips = trips.filter(
    t => t.destinationHospital === selectedHospitalName && t.status !== TripStatus.COMPLETED
  );
  
  const completedTrips = trips.filter(
    t => t.destinationHospital === selectedHospitalName && t.status === TripStatus.COMPLETED
  );

  const activeTrip = trips.find(t => t.id === selectedTripId);

  const handleUnlockPatient = async () => {
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

  const handleDoctorSubmit = async () => {
    if (!activeTrip || !doctorName || !licenseNumber) return;
    setSigning(true);
    try {
      await onDoctorSignOff(activeTrip.id, { doctorName, licenseNumber });
      alert("Physician digital sign-off recorded. Claims report successfully generated.");
      setUnlockedPatient(null);
      setSelectedTripId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Select */}
      <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-2 border border-teal-200 text-teal-700">
            <Hospital className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest font-display">Hospital Intake & ER Clinician Center</h2>
            <span className="text-[10px] text-zinc-600 block font-mono font-black uppercase tracking-wider">ENCRYPTED PATIENT PORTAL LINK</span>
          </div>
        </div>

        <div>
          <label className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">SELECT FACILITY</label>
          <select 
            value={selectedHospitalName}
            onChange={(e) => {
              setSelectedHospitalName(e.target.value);
              setSelectedTripId(null);
              setUnlockedPatient(null);
            }}
            className="bg-white border border-zinc-300 text-[11px] text-teal-700 font-mono font-bold py-1.5 px-3 rounded-none focus:outline-none"
          >
            <option value="Mercy General Trauma Center">Mercy General Trauma Center (Level 1)</option>
            <option value="St. Jude Cardiac Specialty">St. Jude Cardiac Specialty</option>
            <option value="City Community Hospital">City Community Hospital</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Incoming and Completed Intake Lists */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Incoming Ambulance queue */}
          <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex flex-col h-[280px]">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest pb-3 border-b border-zinc-200 flex items-center justify-between font-display">
              <span>INCOMING ER PATIENTS</span>
              <span className="bg-red-50 text-red-700 text-[9px] border border-red-200 px-1.5 py-0.5 rounded-none animate-pulse font-mono font-black">
                {incomingTrips.length} EN ROUTE
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {incomingTrips.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase font-black tracking-wider">No Active Ingress Units</span>
                </div>
              ) : (
                incomingTrips.map(trip => (
                  <div 
                    key={trip.id}
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setUnlockedPatient(null);
                      setPinInput("");
                      setUnlockError("");
                    }}
                    className={`p-3 rounded-none border cursor-pointer transition-all ${
                      selectedTripId === trip.id 
                        ? "bg-teal-50 border-teal-650 text-zinc-900" 
                        : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-mono text-zinc-600 font-black">ID: {trip.id}</span>
                      <span className={`text-[8px] font-mono font-black px-1.5 py-0.2 border rounded-none uppercase ${
                        trip.triageLevel === "RED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-750 border-amber-200"
                      }`}>
                        {trip.triageLevel}
                      </span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-tight truncate">{trip.locationName}</div>
                    <div className="text-[8px] text-zinc-600 font-mono mt-1 uppercase font-black tracking-wider">STATUS: {trip.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed / Handed Over queue */}
          <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex flex-col h-[180px]">
            <h3 className="text-xs font-black text-zinc-550 uppercase tracking-widest pb-3 border-b border-zinc-200 font-display">
              COMPLETED HAND-OFFS TODAY
            </h3>
            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {completedTrips.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase font-black tracking-wider">No recent hand-offs</span>
                </div>
              ) : (
                completedTrips.map(trip => (
                  <div key={trip.id} className="p-2.5 rounded-none bg-zinc-50 border border-zinc-200 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-zinc-900 uppercase font-display block text-[11px]">{trip.patientInfo.name}</strong>
                      <span className="text-[9px] font-mono text-zinc-650 font-bold uppercase">Signed: {trip.doctorSignOff.doctorName}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Detail Intake Dashboard & Vitals monitor stream */}
        <div className="lg:col-span-2">
          {activeTrip ? (
            <div className="space-y-6">
              
              {/* Telemetry Stream Monitor */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                    <Activity className="w-4 h-4 text-red-655 animate-pulse" />
                    <span>REAL-TIME DECRYPTED TELEMETRY FEED</span>
                  </h3>
                  <span className="text-[9px] font-mono text-teal-700 font-black tracking-wider">SECURE 256-BIT SHIELDED LINK</span>
                </div>

                {activeTrip.clinicalRecord.vitals.length === 0 ? (
                  <div className="bg-zinc-50 p-6 rounded-none border border-zinc-200 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    AWAITING PARAMEDIC ON-BOARD TELEMETRY SIGNAL...
                  </div>
                ) : (
                  (() => {
                    const latest = activeTrip.clinicalRecord.vitals[activeTrip.clinicalRecord.vitals.length - 1];
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 text-center">
                          <span className="text-[9px] font-mono font-black text-zinc-650 block mb-1 uppercase tracking-wider">HEART RATE</span>
                          <strong className="text-4xl font-mono text-red-655 font-black animate-pulse">{latest.heartRate}</strong>
                          <span className="text-[8px] font-mono font-black text-zinc-500 block mt-1 uppercase tracking-widest">BPM RECEIVED</span>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 text-center">
                          <span className="text-[9px] font-mono font-black text-zinc-655 block mb-1 uppercase tracking-wider">BLOOD PRESSURE</span>
                          <strong className="text-3xl font-mono text-teal-700 font-black">{latest.bloodPressure}</strong>
                          <span className="text-[8px] font-mono font-black text-zinc-500 block mt-1 uppercase tracking-widest">SYS / DIA HG</span>
                        </div>
                        <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 text-center">
                          <span className="text-[9px] font-mono font-black text-zinc-655 block mb-1 uppercase tracking-wider">SPO2 OXYGENATION</span>
                          <strong className="text-4xl font-mono text-emerald-700 font-black">{latest.spo2}%</strong>
                          <span className="text-[8px] font-mono font-black text-zinc-500 block mt-1 uppercase tracking-widest">SATURATION RATE</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Secure Patient Record Lockbox */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <ShieldAlert className="w-4 h-4 text-blue-750" />
                  <span>SECURE HIPAA PATIENT RECORD ACCESS</span>
                </h3>

                {!unlockedPatient ? (
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none space-y-3">
                    <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-wider">
                      Patient identification data is encrypted at rest. Enter the secure 4-digit verification PIN provided by the paramedic unit to unlock clinician records.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="SECURITY PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g,''))}
                        className="bg-white border border-zinc-300 rounded-none px-3 py-1.5 text-xs text-zinc-900 w-36 text-center font-mono font-black focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleUnlockPatient}
                        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-900 px-4 py-1.5 rounded-none text-[10px] font-black font-mono uppercase tracking-widest transition-colors"
                      >
                        DECRYPT RECORD
                      </button>
                    </div>
                    {unlockError && <p className="text-[10px] text-red-655 font-mono font-black uppercase tracking-wider">{unlockError}</p>}
                  </div>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none space-y-3 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200">
                      <div>
                        <span className="text-[9px] font-mono font-black text-zinc-600 block uppercase tracking-wider">PATIENT FULL NAME</span>
                        <strong className="text-zinc-900 text-sm uppercase font-display font-black">{unlockedPatient.name}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-black text-zinc-600 block uppercase tracking-wider">DATE OF BIRTH</span>
                        <strong className="text-zinc-900 text-sm font-bold">{unlockedPatient.dob}</strong>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200">
                      <div>
                        <span className="text-[9px] font-mono font-black text-zinc-600 block uppercase tracking-wider">SSN VERIFICATION ENVELOPE</span>
                        <strong className="text-zinc-900 font-bold">{unlockedPatient.ssnLocked}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-black text-zinc-600 block uppercase tracking-wider">GENDER</span>
                        <strong className="text-zinc-900 uppercase font-bold">{unlockedPatient.gender}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-black text-zinc-650 block mb-1 uppercase tracking-wider">DECLARED PRIOR TRAUMAS / MEDICAL HISTORY</span>
                      <p className="bg-white p-3 rounded-none border border-zinc-200 text-[10px] text-zinc-800 leading-relaxed font-mono uppercase tracking-wide">
                        {unlockedPatient.medicalHistory}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Transport Telemetry Summary: Kilometers & Equipment Portal */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <span className="bg-teal-600 w-1.5 h-3.5 block" />
                  <span>PRE-HOSPITAL CLINICAL TRANSITION DETAILS</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none">
                    <span className="text-[9px] font-mono font-black text-zinc-500 block mb-1 uppercase tracking-wider">KILOMETERS TRAVELED</span>
                    <strong className="text-2xl font-mono text-teal-700 font-black">
                      {activeTrip.kilometersCovered ? `${activeTrip.kilometersCovered.toFixed(1)} km` : "Pending update"}
                    </strong>
                    <span className="text-[8px] font-mono font-bold text-zinc-500 block mt-1 uppercase tracking-wider">
                      Ambulance transit path
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none md:col-span-2">
                    <span className="text-[9px] font-mono font-black text-zinc-500 block mb-1.5 uppercase tracking-wider">ON-BOARD EQUIPMENTS UTILIZED PORTAL</span>
                    {activeTrip.equipmentsUsed && activeTrip.equipmentsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeTrip.equipmentsUsed.map((eq, idx) => (
                          <span key={idx} className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-mono px-2 py-0.5 rounded-none font-bold uppercase tracking-wider">
                            {eq}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest italic block">
                        No equipment records saved yet by paramedic unit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Physician Sign-off & Claims Generation */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <PenTool className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>PHYSICIAN DIGITAL SIGN-OFF & CLAIM RELEASE</span>
                </h3>

                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 space-y-4">
                  <p className="text-[10px] text-zinc-600 leading-relaxed uppercase tracking-widest">
                    By signing below, the attending clinician registers the handover from paramedics. This transitions the rescue flight to COMPLETED and triggers **automated claims report generation via Gemini AI** for instant billing.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">PHYSICIAN SIGNATURE NAME</label>
                      <input 
                        type="text" 
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 p-2.5 rounded-none focus:outline-none focus:border-amber-500 font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">PHYSICIAN LICENSE NO</label>
                      <input 
                        type="text" 
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 p-2.5 rounded-none focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleDoctorSubmit}
                    disabled={signing}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black font-mono text-[10px] uppercase tracking-widest py-3 border border-amber-600 rounded-none flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileCheck className="w-4 h-4 text-black" />
                    <span>{signing ? "AI COMPILING INSURANCE CLAIMS..." : "PHYSICIAN SIGN-OFF & AUTO-GENERATE REPORT"}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-none p-10 text-center min-h-[300px] flex items-center justify-center shadow-md">
              <div>
                <Hospital className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
                <span className="text-xs font-black text-zinc-900 block uppercase tracking-[0.2em] font-display">NO ACTIVE SELECTION</span>
                <p className="text-zinc-600 font-mono text-[10px] max-w-xs mt-2 uppercase tracking-widest leading-relaxed">
                  Select an active incoming rescue vehicle in the left pane to view live telemetry streams and physician handover tools.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
