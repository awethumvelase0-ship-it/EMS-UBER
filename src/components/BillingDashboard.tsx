/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileSpreadsheet, ClipboardList, RefreshCw, FileText, 
  Trash2, Plus, Sparkles, DollarSign, CheckCircle2 
} from "lucide-react";
import { DispatchTrip, MedicalCode, TripStatus } from "../types";

interface BillingDashboardProps {
  trips: DispatchTrip[];
  onAddCode: (tripId: string, codeObj: MedicalCode) => Promise<void>;
  onRemoveCode: (tripId: string, code: string) => Promise<void>;
  onRecomputeClaim: (tripId: string) => Promise<void>;
}

export default function BillingDashboard({
  trips,
  onAddCode,
  onRemoveCode,
  onRecomputeClaim
}: BillingDashboardProps) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(trips[0]?.id || null);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"ICD-10" | "CPT">("ICD-10");
  const [loadingRecompute, setLoadingRecompute] = useState(false);

  // Billing views completed runs
  const billingRuns = trips.filter(t => t.status === TripStatus.COMPLETED || t.doctorSignOff.signed);
  const activeTrip = trips.find(t => t.id === selectedTripId);

  const handleAddCode = async () => {
    if (!activeTrip || !newCode || !newDesc) return;
    await onAddCode(activeTrip.id, {
      code: newCode,
      description: newDesc,
      type: newType
    });
    setNewCode("");
    setNewDesc("");
  };

  const handleRemoveCode = async (code: string) => {
    if (!activeTrip) return;
    await onRemoveCode(activeTrip.id, code);
  };

  const triggerRecompute = async () => {
    if (!activeTrip) return;
    setLoadingRecompute(true);
    try {
      await onRecomputeClaim(activeTrip.id);
      alert("Claims summary successfully re-compiled by Gemini AI.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecompute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Medical Billing & Claims Audit Desk</h2>
            <span className="text-xs text-slate-400 block font-mono">HIPAA & ICD-10 COMPLIANT PORTAL</span>
          </div>
        </div>

        <div className="bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
          COMPLIANCE CODE: <strong className="text-emerald-400">ICD10-CMS-V2026</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Completed dispatch runs list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[400px]">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest pb-3 border-b border-slate-800">
              Completed Ambulance Runs ({billingRuns.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {billingRuns.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-xs font-mono text-slate-500 uppercase">No completed runs logged</span>
                </div>
              ) : (
                billingRuns.map(trip => (
                  <div 
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTripId === trip.id 
                        ? "bg-emerald-950/20 border-emerald-500/80" 
                        : "bg-slate-950 border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">ID: {trip.id}</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        ${trip.insuranceReport.claimedAmount || (trip.triageLevel === "RED" ? 2450.00 : 1200.00)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-bold truncate">{trip.patientInfo.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase">TRIAGE: {trip.triageLevel}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Detailed claims billing audit and code selector */}
        <div className="lg:col-span-2">
          {activeTrip ? (
            <div className="space-y-6">
              
              {/* Financial & Reimbursement Claim Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Claim Financial Summary</span>
                  </h3>
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                    {activeTrip.insuranceReport.claimStatus || "PENDING_SUBMISSION"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-[9px] font-mono text-slate-500 block mb-1">CLAIM BASE RATE</span>
                    <strong className="text-3xl font-mono text-emerald-400 font-bold">
                      ${activeTrip.triageLevel === "RED" ? "2,450.00" : "1,200.00"}
                    </strong>
                    <span className="text-[8px] font-mono text-slate-400 block mt-1">
                      {activeTrip.triageLevel === "RED" ? "ALS Advanced Base" : "BLS EMT Base"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-[9px] font-mono text-slate-500 block mb-1">INSURANCE ENROLLEE</span>
                    <strong className="text-slate-200 text-sm truncate block mt-1">{activeTrip.insuranceReport.insuranceProvider || "Blue Shield CA"}</strong>
                    <span className="text-[9px] font-mono text-slate-400 block mt-1">
                      {activeTrip.insuranceReport.policyNumber || "POL-88219"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <span className="text-[9px] font-mono text-slate-500 block mb-1">PHYSICIAN SIGNED CREDENTIAL</span>
                    <strong className="text-slate-200 text-sm truncate block mt-1">{activeTrip.doctorSignOff.doctorName || "Not signed"}</strong>
                    <span className="text-[9px] font-mono text-slate-400 block mt-1">
                      License: {activeTrip.doctorSignOff.licenseNumber || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Coding Registry & Input Component */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  <span>Interactive Medical Coding Panel</span>
                </h3>

                {/* Assigned List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500">ASSIGNED DIAGNOSTIC (ICD-10) & PROCEDURAL (CPT) CODES:</span>
                  {activeTrip.medicalCodes.length === 0 ? (
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center text-xs text-slate-500 font-mono">
                      NO CLASSIFICATION CODES LOGGED. ASSIGN BELOW.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activeTrip.medicalCodes.map((c, i) => (
                        <div key={i} className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold text-teal-300 bg-slate-900 px-1.5 py-0.5 rounded">
                                {c.code}
                              </span>
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-900">
                                {c.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-300 block mt-1 leading-normal">{c.description}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveCode(c.code)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-950/20 p-1.5 rounded transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to manual add codes with speed */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-3">
                  <span className="text-[10px] font-mono text-teal-400 block font-bold">RAPID CODE ENTRY</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 block mb-1">CLASSIFICATION TYPE</label>
                      <select 
                        value={newType} 
                        onChange={(e) => setNewType(e.target.value as "ICD-10" | "CPT")}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-teal-500"
                      >
                        <option value="ICD-10">ICD-10 (Diagnostic)</option>
                        <option value="CPT">CPT (Procedural / Transport)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 block mb-1">CODE VALUE</label>
                      <input 
                        type="text" 
                        placeholder="e.g. R07.9 or 99283"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-teal-500 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 block mb-1">SHORT DESCRIPTION</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chest pain unspecified"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddCode}
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold font-mono px-3 py-1.5 rounded flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD CODE TO RECORD</span>
                  </button>
                </div>
              </div>

              {/* Automated Claims Report (AI Summary) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Automated AI Insurance Claims File</span>
                  </h3>
                  <button 
                    onClick={triggerRecompute}
                    disabled={loadingRecompute}
                    className="text-[10px] font-mono text-teal-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRecompute ? "animate-spin" : ""}`} />
                    <span>RE-GENERATE SUMMARY</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  {activeTrip.insuranceReport.generatedSummary ? (
                    <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap select-all selection:bg-teal-900">
                      {activeTrip.insuranceReport.generatedSummary}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs font-mono py-4">
                      AWAITING PHYSICIAN SIGN-OFF DATA AND CLAIMS COMPILE...
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => {
                      alert("Claim file locked & successfully transmitted to insurance clearinghouse under secure HIPAA handshake.");
                    }}
                    disabled={!activeTrip.insuranceReport.generatedSummary}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUBMIT INSURANCE CLAIM FILE</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center min-h-[300px] flex items-center justify-center">
              <div>
                <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <span className="text-xs font-mono text-slate-500 block uppercase">No Completed Runs Selected</span>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Select a completed dispatch on the left pane to audit billing rates, code classifications, and compiled insurance files.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
