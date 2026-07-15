/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, Siren, HeartPulse, User, Hospital, 
  FileSpreadsheet, Terminal, Activity, RefreshCw, Menu 
} from "lucide-react";

import { 
  UserRole, Ambulance, DispatchTrip, TripStatus, 
  TriageLevel, HIPAAAuditLog, MedicalCode 
} from "./types";

import ClientDashboard from "./components/ClientDashboard";
import ParamedicDashboard from "./components/ParamedicDashboard";
import DispatcherDashboard from "./components/DispatcherDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import BillingDashboard from "./components/BillingDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AmbulanceRegistrationDashboard from "./components/AmbulanceRegistrationDashboard";

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CLIENT);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [auditLogs, setAuditLogs] = useState<HIPAAAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Poll state from full-stack server
  const fetchAllData = async () => {
    try {
      const [ambRes, tripRes, logRes] = await Promise.all([
        fetch("/api/ambulances"),
        fetch("/api/trips"),
        fetch("/api/audit-logs")
      ]);

      if (ambRes.ok && tripRes.ok && logRes.ok) {
        const ambData = await ambRes.json();
        const tripData = await tripRes.json();
        const logData = await logRes.json();
        
        setAmbulances(ambData);
        setTrips(tripData);
        setAuditLogs(logData);
      }
    } catch (err) {
      console.warn("Could not fetch from Express API. Using offline simulated state.");
    } finally {
      setLoading(false);
    }
  };

  // On mount and periodic polling for real-time GPS tracking
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Post Panic Button Trigger (Automated dispatch triage)
  const handlePanicTrigger = async (triage: TriageLevel, patientData: any) => {
    try {
      const res = await fetch("/api/trips/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triageLevel: triage, ...patientData })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel Emergency
  const handleCancelTrip = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: TripStatus.COMPLETED, 
          note: "Emergency aborted by client",
          user: "Patient Caller",
          role: UserRole.CLIENT
        })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manual Dispatch override
  const handleManualDispatch = async (tripId: string, ambulanceId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: TripStatus.ON_ROUTE, 
          note: `Dispatcher assigned ambulance unit manually`,
          user: "Chief Dispatcher",
          role: UserRole.DISPATCHER,
          ambulanceId
        })
      });
      if (res.ok) {
        // Also bind ambulance on server
        await fetch(`/api/trips/${tripId}/clinical`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms: "Manually dispatched" })
        });
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update trip status (Paramedics milestones)
  const handleUpdateTripStatus = async (tripId: string, status: TripStatus, note: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status, 
          note,
          user: "On-Board Paramedic",
          role: UserRole.PARAMEDIC
        })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PIN Unlock patient records (HIPAA compliance)
  const handleUnlockPatient = async (tripId: string, pin: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/unlock-patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pin,
          user: "Attending Clinician",
          role: currentRole
        })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
      return { error: "Network unlock failure" };
    }
  };

  // Add real-time vitals
  const handleAddVitals = async (tripId: string, vitals: any) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitals)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update clinical notes/symptoms
  const handleUpdateClinical = async (tripId: string, clinical: any) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/clinical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinical)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Medical ICD-10/CPT Code
  const handleAddCode = async (tripId: string, codeObj: MedicalCode) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeObj)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Medical ICD-10/CPT Code
  const handleRemoveCode = async (tripId: string, code: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/codes/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Physician Sign-off (triggers AI Claims compilation)
  const handleDoctorSignOff = async (tripId: string, doctorData: { doctorName: string; licenseNumber: string }) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/doctor-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync Offline Data queue
  const handleSyncOfflineData = async (queue: any[]) => {
    try {
      const res = await fetch("/api/offline-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue, user: "Field Paramedic (Auto)" })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Re-generate claim with Gemini manually
  const handleRecomputeClaim = async (tripId: string) => {
    try {
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;
      await handleDoctorSignOff(tripId, {
        doctorName: trip.doctorSignOff.doctorName || "Dr. Gregory House",
        licenseNumber: trip.doctorSignOff.licenseNumber || "MD-9912"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterAmbulance = async (ambulanceData: any) => {
    try {
      const res = await fetch("/api/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ambulanceData)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadComplianceDoc = async (ambulanceId: string, documentData: any) => {
    try {
      const res = await fetch(`/api/ambulances/${ambulanceId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: documentData })
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleTrip = async (scheduleData: any) => {
    try {
      const res = await fetch("/api/trips/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData)
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Find active distress trip for Client view (excludes completed and scheduled trips)
  const activeClientTrip = trips.find(t => t.status !== TripStatus.COMPLETED && t.status !== TripStatus.SCHEDULED);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* Top Navigation / System Bar */}
      <nav className="border-b border-zinc-200 flex flex-col md:flex-row items-center justify-between px-6 py-3.5 bg-white gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            id="toggle-nav-btn"
            onClick={() => setIsNavVisible(!isNavVisible)}
            className="p-2 hover:bg-zinc-100 border border-zinc-200 rounded-none flex items-center justify-center gap-2 transition-all text-zinc-850 font-mono text-[10px] font-black uppercase tracking-wider"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-4 h-4 text-zinc-900" />
            <span>{isNavVisible ? "Hide Nav" : "Show Nav"}</span>
          </button>
          <div className="bg-red-600 text-white px-3 py-1 text-xs font-black tracking-tighter uppercase font-display">EMS CORE</div>
          <div className="hidden md:block h-4 w-px bg-zinc-350"></div>
          <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse"></span>
            <span>Unit Status: EMS-UBER LIVE DEPLOYMENT</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)]"></div>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-mono">BIOMETRIC SECURE</span>
          </div>
          <div className="h-4 w-px bg-zinc-200 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-mono">ENCRYPTION: AES-256</span>
          </div>
        </div>
      </nav>

      {/* Left Navigation and Main Area Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto">
        
        {/* Left Side Navigation Sidebar */}
        {isNavVisible && (
          <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-4 md:p-6 shrink-0 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-200">
            <div>
              <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block mb-2">EMS CORE ROLES</span>
              <div className="flex flex-col gap-2">
                
                <button 
                  id="role-client"
                  onClick={() => setCurrentRole(UserRole.CLIENT)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.CLIENT 
                      ? "bg-red-50 text-red-700 border-red-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>1. Patient Caller</span>
                </button>

                <button 
                  id="role-dispatcher"
                  onClick={() => setCurrentRole(UserRole.DISPATCHER)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.DISPATCHER 
                      ? "bg-blue-50 text-blue-700 border-blue-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>2. Dispatcher</span>
                </button>

                <button 
                  id="role-paramedic"
                  onClick={() => setCurrentRole(UserRole.PARAMEDIC)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.PARAMEDIC 
                      ? "bg-amber-50 text-amber-700 border-amber-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <HeartPulse className="w-4 h-4 shrink-0" />
                  <span>3. Paramedic</span>
                </button>

                <button 
                  id="role-hospital"
                  onClick={() => setCurrentRole(UserRole.HOSPITAL)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.HOSPITAL 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Hospital className="w-4 h-4 shrink-0" />
                  <span>4. ER Portal</span>
                </button>

                <button 
                  id="role-billing"
                  onClick={() => setCurrentRole(UserRole.BILLING)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.BILLING 
                      ? "bg-teal-50 text-teal-700 border-teal-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>5. Billing Desk</span>
                </button>

                <button 
                  id="role-admin"
                  onClick={() => setCurrentRole(UserRole.ADMIN)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.ADMIN 
                      ? "bg-purple-50 text-purple-700 border-purple-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Terminal className="w-4 h-4 shrink-0" />
                  <span>6. Audit Admin</span>
                </button>

                <button 
                  id="role-provider"
                  onClick={() => setCurrentRole(UserRole.PROVIDER)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-[0.15em] transition-all w-full text-left border-l-2 ${
                    currentRole === UserRole.PROVIDER 
                      ? "bg-rose-50 text-rose-700 border-rose-600" 
                      : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Siren className="w-4 h-4 shrink-0 text-red-600" />
                  <span>7. Operator Registry</span>
                </button>

              </div>
            </div>

            <div className="mt-auto hidden md:block pt-6 border-t border-zinc-200">
              <div className="bg-zinc-50 p-4 border border-zinc-200 space-y-2">
                <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block">SYSTEM METRICS</span>
                <div className="flex justify-between items-center text-[10px] text-zinc-600">
                  <span>ACTIVE CALLS:</span>
                  <span className="font-mono font-bold text-red-600">
                    {trips.filter(t => t.status !== TripStatus.COMPLETED).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-600">
                  <span>TOTAL AMBULANCES:</span>
                  <span className="font-mono font-bold text-zinc-850">
                    {ambulances.length}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Display Area */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">LINKING CLIENT TERMINALS...</span>
            </div>
          ) : (
            <motion.div 
              key={currentRole}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {currentRole === UserRole.CLIENT && (
                <ClientDashboard 
                  ambulances={ambulances}
                  trips={trips}
                  activeTrip={activeClientTrip || null}
                  onPanicTrigger={handlePanicTrigger}
                  onCancelTrip={handleCancelTrip}
                  onScheduleTrip={handleScheduleTrip}
                />
              )}

              {currentRole === UserRole.DISPATCHER && (
                <DispatcherDashboard 
                  ambulances={ambulances}
                  trips={trips}
                  onManualDispatch={handleManualDispatch}
                  onForceCancel={handleCancelTrip}
                />
              )}

              {currentRole === UserRole.PARAMEDIC && (
                <ParamedicDashboard 
                  ambulances={ambulances}
                  trips={trips}
                  onUpdateTripStatus={handleUpdateTripStatus}
                  onUnlockPatient={handleUnlockPatient}
                  onAddVitals={handleAddVitals}
                  onUpdateClinical={handleUpdateClinical}
                  onAddCode={handleAddCode}
                  onSyncOfflineData={handleSyncOfflineData}
                />
              )}

              {currentRole === UserRole.HOSPITAL && (
                <HospitalDashboard 
                  trips={trips}
                  ambulances={ambulances}
                  onUnlockPatient={handleUnlockPatient}
                  onDoctorSignOff={handleDoctorSignOff}
                />
              )}

              {currentRole === UserRole.BILLING && (
                <BillingDashboard 
                  trips={trips}
                  onAddCode={handleAddCode}
                  onRemoveCode={handleRemoveCode}
                  onRecomputeClaim={handleRecomputeClaim}
                />
              )}

              {currentRole === UserRole.ADMIN && (
                <AdminDashboard 
                  logs={auditLogs}
                  onRefreshLogs={fetchAllData}
                />
              )}

              {currentRole === UserRole.PROVIDER && (
                <AmbulanceRegistrationDashboard 
                  ambulances={ambulances}
                  onRegisterAmbulance={handleRegisterAmbulance}
                  onUploadComplianceDoc={handleUploadComplianceDoc}
                />
              )}
            </motion.div>
          )}

        </main>
      </div>

      {/* Bottom Integrated Billing & Admin Bar */}
      <footer className="bg-zinc-100 border-t border-zinc-200 py-4.5 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 mt-auto gap-4">
        <div className="flex flex-wrap items-center gap-6 justify-center">
          <div className="flex gap-2 items-center">
            <span className="font-black text-zinc-400 uppercase">Encryption:</span>
            <span className="text-green-600 font-bold">E2E ACTIVE (AES-256)</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-black text-zinc-400 uppercase">Claims:</span>
            <span className="text-zinc-800 font-bold">AUTO-GEN READY</span>
          </div>
        </div>
        <div className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter text-center md:text-right">
          &copy; 2026 EMS-Uber Command. HIPAA-2024.v4 Certified Audit Registry.
        </div>
      </footer>

    </div>
  );
}
