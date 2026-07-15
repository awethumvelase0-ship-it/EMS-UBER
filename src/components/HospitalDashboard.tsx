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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-2 rounded-lg border border-teal-500/20 text-teal-400">
            <Hospital className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Hospital Intake & ER Clinician Center</h2>
            <span className="text-xs text-slate-400 block font-mono">ENCRYPTED PATIENT PORTAL LINK</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-500 block mb-1">SELECT FACILITY</label>
          <select 
            value={selectedHospitalName}
            onChange={(e) => {
              setSelectedHospitalName(e.target.value);
              setSelectedTripId(null);
              setUnlockedPatient(null);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-teal-300 font-mono py-1.5 px-3 rounded focus:outline-none"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[280px]">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Incoming ER Patients</span>
              <span className="bg-red-950 text-red-400 text-[10px] border border-red-900 px-1.5 py-0.2 rounded animate-pulse font-bold">
                {incomingTrips.length} EN ROUTE
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {incomingTrips.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-xs font-mono text-slate-500 uppercase">No Active Ingress Units</span>
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
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTripId === trip.id 
                        ? "bg-teal-950/20 border-teal-500/80" 
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">ID: {trip.id}</span>
                      <span className={`text-[8px] font-mono font-bold px-1 rounded ${
                        trip.triageLevel === "RED" ? "bg-red-950 text-red-400 border border-red-900" : "bg-amber-950 text-amber-400 border border-amber-900"
                      }`}>
                        {trip.triageLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-bold truncate">{trip.locationName}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">STATUS: {trip.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed / Handed Over queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[180px]">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-800">
              Completed Hand-offs Today
            </h3>
            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {completedTrips.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-xs font-mono text-slate-500 uppercase text-[10px]">No recent hand-offs</span>
                </div>
              ) : (
                completedTrips.map(trip => (
                  <div key={trip.id} className="p-2.5 rounded bg-slate-950 border border-slate-850 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-300 block">{trip.patientInfo.name}</strong>
                      <span className="text-[9px] font-mono text-slate-500">Signed: {trip.doctorSignOff.doctorName}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Real-time Decrypted Telemetry Feed</span>
                  </h3>
                  <span className="text-[9px] font-mono text-teal-400 font-bold">STABLE 256-BIT STREAM</span>
                </div>

                {activeTrip.clinicalRecord.vitals.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 text-center text-slate-500 text-xs font-mono">
                    AWAITING PARAMEDIC ON-BOARD TELEMETRY SIGNAL...
                  </div>
                ) : (
                  (() => {
                    const latest = activeTrip.clinicalRecord.vitals[activeTrip.clinicalRecord.vitals.length - 1];
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                          <span className="text-[9px] font-mono text-slate-500 block mb-1">HEART RATE</span>
                          <strong className="text-4xl font-mono text-red-500 font-black animate-pulse">{latest.heartRate}</strong>
                          <span className="text-[8px] font-mono text-slate-400 block mt-1">BPM TRANSMITTED</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                          <span className="text-[9px] font-mono text-slate-500 block mb-1">BLOOD PRESSURE</span>
                          <strong className="text-3xl font-mono text-teal-400 font-black">{latest.bloodPressure}</strong>
                          <span className="text-[8px] font-mono text-slate-400 block mt-1">SYS / DIA HG</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                          <span className="text-[9px] font-mono text-slate-500 block mb-1">SPO2 OXYGENATION</span>
                          <strong className="text-4xl font-mono text-emerald-400 font-black">{latest.spo2}%</strong>
                          <span className="text-[8px] font-mono text-slate-400 block mt-1">SATURATION RATE</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Secure Patient Record Lockbox */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-teal-400" />
                  <span>Secure HIPAA Patient Record Access</span>
                </h3>

                {!unlockedPatient ? (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Demographic data is securely locked at rest to meet strict HIPAA-compliance laws. Request the on-board paramedic crew to transmit the secure PIN or enter it here.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="VERIFICATION PIN"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g,''))}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 w-36 text-center font-mono font-bold"
                      />
                      <button 
                        onClick={handleUnlockPatient}
                        className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-3 py-1.5 rounded text-xs font-bold font-mono"
                      >
                        DECRYPT RECORD
                      </button>
                    </div>
                    {unlockError && <p className="text-[10px] text-red-400 font-mono">{unlockError}</p>}
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-900">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block">PATIENT NAME</span>
                        <strong className="text-slate-200 text-sm">{unlockedPatient.name}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block">DATE OF BIRTH</span>
                        <strong className="text-slate-200 text-sm font-mono">{unlockedPatient.dob}</strong>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-900">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block">SSN RECORD LOCK</span>
                        <strong className="text-slate-200 font-mono">{unlockedPatient.ssnLocked}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block">GENDER</span>
                        <strong className="text-slate-200">{unlockedPatient.gender}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block mb-1">DECLARED PRIOR TRAUMAS / CONDITONS</span>
                      <p className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
                        {unlockedPatient.medicalHistory}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Physician Sign-off & Claims Generation */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Physician Digital Sign-off & Claim Release</span>
                </h3>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    By signing below, the attending clinician registers the handover from paramedics. This transitions the flight to completed status and triggers the **automated server-side claims report generation via Gemini AI** for immediate insurance billing.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">PHYSICIAN SIGNATURE NAME</label>
                      <input 
                        type="text" 
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">PHYSICIAN LICENSE NO</label>
                      <input 
                        type="text" 
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleDoctorSubmit}
                    disabled={signing}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-98"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{signing ? "AI COMPILING CLAIMS FILE..." : "PHYSICIAN SIGN-OFF & AUTO-GENERATE REPORT"}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center min-h-[300px] flex items-center justify-center">
              <div>
                <Hospital className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-500 block uppercase">No Active Selection</span>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Select an active incoming rescue vehicle in the left pane to view clinical feeds and physician sign-off tools.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
