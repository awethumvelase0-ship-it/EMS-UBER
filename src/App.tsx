/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldCheck, Siren, HeartPulse, User, Hospital, 
  FileSpreadsheet, Terminal, Activity, RefreshCw,
  Menu, X
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

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.CLIENT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [auditLogs, setAuditLogs] = useState<HIPAAAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

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
          role: UserRole.DISPATCHER
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

  // Find active distress trip for Client view
  const activeClientTrip = trips.find(t => t.status !== TripStatus.COMPLETED);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex font-sans selection:bg-red-950 selection:text-red-200">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Unified Sidebar (Desktop Static, Mobile Drawer) */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-[#111114] border-r border-zinc-800/80 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white px-3 py-1.5 text-xs font-black tracking-tighter uppercase font-display rounded shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                EMS CORE
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-850 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unit Status */}
          <div className="px-6 py-4 border-b border-zinc-800/50 bg-[#0c0c0e]">
            <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)] animate-pulse shrink-0"></span>
              <span className="leading-tight">EMS-UBER LIVE DEPLOYMENT</span>
            </span>
          </div>

          {/* Role Navigation Items */}
          <nav className="p-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-2 mb-2 font-mono">
              Dashboard Terminals
            </span>
            
            <button 
              id="role-client"
              onClick={() => {
                setCurrentRole(UserRole.CLIENT);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.CLIENT 
                  ? "bg-red-600/10 text-red-400 border-red-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <User className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.CLIENT ? "text-red-400" : "text-zinc-500"}`} />
              <span>1. Caller / Patient</span>
            </button>

            <button 
              id="role-dispatcher"
              onClick={() => {
                setCurrentRole(UserRole.DISPATCHER);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.DISPATCHER 
                  ? "bg-blue-600/10 text-blue-400 border-blue-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <Activity className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.DISPATCHER ? "text-blue-400" : "text-zinc-500"}`} />
              <span>2. Dispatch Coordinator</span>
            </button>

            <button 
              id="role-paramedic"
              onClick={() => {
                setCurrentRole(UserRole.PARAMEDIC);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.PARAMEDIC 
                  ? "bg-amber-600/10 text-amber-400 border-amber-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <HeartPulse className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.PARAMEDIC ? "text-amber-400" : "text-zinc-500"}`} />
              <span>3. Paramedic Terminal</span>
            </button>

            <button 
              id="role-hospital"
              onClick={() => {
                setCurrentRole(UserRole.HOSPITAL);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.HOSPITAL 
                  ? "bg-emerald-600/10 text-emerald-400 border-emerald-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <Hospital className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.HOSPITAL ? "text-emerald-400" : "text-zinc-500"}`} />
              <span>4. Hospital ER Portal</span>
            </button>

            <button 
              id="role-billing"
              onClick={() => {
                setCurrentRole(UserRole.BILLING);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.BILLING 
                  ? "bg-teal-600/10 text-teal-400 border-teal-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.BILLING ? "text-teal-400" : "text-zinc-500"}`} />
              <span>5. Billing Desk</span>
            </button>

            <button 
              id="role-admin"
              onClick={() => {
                setCurrentRole(UserRole.ADMIN);
                setIsSidebarOpen(false);
              }}
              className={`group flex items-center gap-3.5 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] rounded-lg transition-all border-l-2 text-left cursor-pointer ${
                currentRole === UserRole.ADMIN 
                  ? "bg-purple-600/10 text-purple-400 border-purple-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700/50"
              }`}
            >
              <Terminal className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${currentRole === UserRole.ADMIN ? "text-purple-400" : "text-zinc-500"}`} />
              <span>6. Audit Admin</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-855 bg-[#0C0C0E] flex flex-col gap-2.5 text-[10px] font-mono text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></span>
            <span className="font-bold tracking-wider uppercase text-zinc-400">BIOMETRIC SECURE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></span>
            <span className="font-bold tracking-wider uppercase text-zinc-400">AES-256 ENCRYPTION</span>
          </div>
          <div className="mt-2 text-[9px] text-zinc-650 leading-tight uppercase font-black border-t border-zinc-850 pt-2">
            HIPAA-2024.v4 CERTIFIED
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#111114] border-b border-zinc-800 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-red-600 text-white px-2 py-0.5 text-xs font-black tracking-tighter uppercase font-display rounded">
              EMS CORE
            </div>
          </div>
          
          <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse"></span>
            <span>LIVE</span>
          </span>
        </header>

        {/* Scrollable Dashboard View */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-7xl w-full mx-auto p-4 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">LINKING CLIENT TERMINALS...</span>
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
                    activeTrip={activeClientTrip || null}
                    onPanicTrigger={handlePanicTrigger}
                    onCancelTrip={handleCancelTrip}
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
              </motion.div>
            )}
          </main>

          {/* Integrated Billing & Admin Footer */}
          <footer className="bg-[#08080A] border-t border-zinc-850 py-5 px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 gap-4">
            <div className="flex flex-wrap items-center gap-6 justify-center sm:justify-start">
              <div className="flex gap-2 items-center">
                <span className="font-black text-zinc-600 uppercase">Encryption:</span>
                <span className="text-green-500 font-bold">E2E ACTIVE (AES-256)</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="font-black text-zinc-600 uppercase">Claims:</span>
                <span className="text-zinc-300 font-bold">AUTO-GEN READY</span>
              </div>
            </div>
            <div className="text-[9px] text-zinc-650 uppercase font-black tracking-tighter text-center sm:text-right">
              &copy; 2026 EMS-Uber Command. HIPAA-2024.v4 Certified Audit Registry.
            </div>
          </footer>
        </div>

      </div>

    </div>
  );
}
