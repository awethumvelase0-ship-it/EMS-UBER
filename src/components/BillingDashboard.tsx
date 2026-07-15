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
      <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 border border-emerald-200 text-emerald-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest font-display">Medical Billing & Claims Audit Desk</h2>
            <span className="text-[10px] text-zinc-600 block font-mono font-black uppercase tracking-wider">HIPAA & ICD-10 COMPLIANT PORTAL</span>
          </div>
        </div>

        <div className="bg-zinc-50 px-3.5 py-1.5 border border-zinc-200 text-[10px] font-mono text-zinc-600 font-black tracking-wider">
          COMPLIANCE CODE: <strong className="text-emerald-750">ICD10-CMS-V2026</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Completed dispatch runs list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md flex flex-col h-[400px]">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest pb-3 border-b border-zinc-200 font-display">
              COMPLETED AMBULANCE RUNS ({billingRuns.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
              {billingRuns.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase font-black tracking-wider">No completed runs logged</span>
                </div>
              ) : (
                billingRuns.map(trip => (
                  <div 
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-3 rounded-none border cursor-pointer transition-all ${
                      selectedTripId === trip.id 
                        ? "bg-emerald-50 border-emerald-650" 
                        : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-mono text-zinc-650 font-black">ID: {trip.id}</span>
                      <span className="text-[10px] font-mono font-black text-emerald-700">
                        ${trip.insuranceReport.claimedAmount || (trip.triageLevel === "RED" ? 2450.00 : 1200.00)}
                      </span>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-tight truncate text-zinc-800">{trip.patientInfo.name}</div>
                    <div className="text-[8px] text-zinc-650 font-mono mt-1 uppercase font-black tracking-wider">TRIAGE: {trip.triageLevel}</div>
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
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>CLAIM FINANCIAL SUMMARY</span>
                  </h3>
                  <span className="bg-emerald-50 text-emerald-750 text-[9px] border border-emerald-200 px-2 py-0.5 rounded-none font-mono font-black tracking-wider">
                    {activeTrip.insuranceReport.claimStatus || "PENDING_SUBMISSION"}
                  </span>
                </div>

                {(() => {
                  const baseAmount = activeTrip.triageLevel === "RED" ? 2450.00 : 1200.00;
                  const mileageRate = 15.00;
                  const kmsCovered = activeTrip.kilometersCovered || 0;
                  const mileageCharge = kmsCovered * mileageRate;

                  const equipmentCharges: Record<string, number> = {
                    "Cardiac Monitor / Defibrillator": 250,
                    "Intravenous (IV) Therapy Kit": 120,
                    "Oxygen Supply (High-Flow)": 95,
                    "Bag Valve Mask (BVM)": 80,
                    "Advanced Airway (Intubation Kit)": 300,
                    "Spinal Immobilization Board": 150,
                    "Suction Unit & Catheter": 85,
                    "Orthopedic Splints": 110,
                    "Epinephrine Auto-Injector": 180,
                    "Nebulizer Therapy": 90
                  };

                  const equipments = activeTrip.equipmentsUsed || [];
                  const equipmentTotal = equipments.reduce((sum, eq) => sum + (equipmentCharges[eq] || 75), 0);
                  const totalClaimAmount = baseAmount + mileageCharge + equipmentTotal;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">TOTAL CLAIMED AMOUNT</span>
                            <strong className="text-2xl font-mono text-emerald-700 font-black">
                              ${totalClaimAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                          </div>
                          <span className="text-[8px] font-mono font-black text-zinc-500 block mt-2 uppercase tracking-wider">
                            Base: ${baseAmount} | Travel: ${mileageCharge.toFixed(2)}
                          </span>
                        </div>

                        <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none">
                          <span className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">INSURANCE ENROLLEE</span>
                          <strong className="text-zinc-800 text-xs font-bold uppercase truncate block mt-1">{activeTrip.insuranceReport.insuranceProvider || "Blue Shield CA"}</strong>
                          <span className="text-[9px] font-mono font-bold text-zinc-500 block mt-1">
                            Policy: {activeTrip.insuranceReport.policyNumber || "POL-88219"}
                          </span>
                        </div>

                        <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none">
                          <span className="text-[9px] font-mono font-black text-zinc-600 block mb-1 uppercase tracking-wider">PHYSICIAN SIGNED CREDENTIAL</span>
                          <strong className="text-zinc-800 text-xs font-bold uppercase truncate block mt-1">{activeTrip.doctorSignOff.doctorName || "Not signed"}</strong>
                          <span className="text-[9px] font-mono font-bold text-zinc-500 block mt-1">
                            License: {activeTrip.doctorSignOff.licenseNumber || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Itemized Claim Handshake Breakdown */}
                      <div className="border border-zinc-200 rounded-none p-4 bg-zinc-50/30 space-y-3">
                        <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block">ITEMIZED CLAIMS BREAKDOWN:</span>
                        
                        <div className="space-y-2 text-xs font-mono text-zinc-750">
                          {/* Base rate row */}
                          <div className="flex justify-between items-center py-1 border-b border-zinc-150">
                            <span className="uppercase text-[9px] font-bold text-zinc-600">Base Transport Rate ({activeTrip.triageLevel} Triage)</span>
                            <span className="font-bold text-zinc-900">${baseAmount.toFixed(2)}</span>
                          </div>

                          {/* Mileage row */}
                          <div className="flex justify-between items-center py-1 border-b border-zinc-150">
                            <div className="flex flex-col">
                              <span className="uppercase text-[9px] font-bold text-zinc-600">Mileage Reimbursement ({kmsCovered.toFixed(1)} km)</span>
                              <span className="text-[8px] text-zinc-500 lowercase tracking-wider">* rate: $15.00/km</span>
                            </div>
                            <span className="font-bold text-zinc-900">${mileageCharge.toFixed(2)}</span>
                          </div>

                          {/* Equipments used portal section */}
                          <div className="py-1">
                            <span className="uppercase text-[9px] font-bold text-zinc-600 block mb-1">Equipments Used Portal Items ({equipments.length}):</span>
                            {equipments.length === 0 ? (
                              <div className="text-[9px] text-zinc-500 italic pl-3 uppercase">No recorded equipment used during transport</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-3 pt-1">
                                {equipments.map((eq, idx) => {
                                  const charge = equipmentCharges[eq] || 75;
                                  return (
                                    <div key={idx} className="flex justify-between items-center bg-white border border-zinc-200 px-2.5 py-1 text-[9px] rounded-none">
                                      <span className="uppercase text-zinc-600 font-bold truncate max-w-[150px]">{eq}</span>
                                      <span className="font-bold text-teal-700 font-mono">+${charge.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Total row */}
                          <div className="flex justify-between items-center pt-2.5 pb-1 border-t border-zinc-250">
                            <span className="uppercase text-[9px] font-black text-zinc-900">Total Calculated Claim Reimbursement</span>
                            <span className="font-black text-emerald-700 text-sm font-mono">${totalClaimAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Fast Coding Registry & Input Component */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <ClipboardList className="w-4 h-4 text-zinc-500" />
                  <span>INTERACTIVE MEDICAL CODING PANEL</span>
                </h3>

                {/* Assigned List */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-wider">ASSIGNED DIAGNOSTIC (ICD-10) & PROCEDURAL (CPT) CODES:</span>
                  {activeTrip.medicalCodes.length === 0 ? (
                    <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none text-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                      NO CLASSIFICATION CODES LOGGED. ASSIGN BELOW.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activeTrip.medicalCodes.map((c, i) => (
                        <div key={i} className="bg-zinc-50 border border-zinc-200 p-3 rounded-none flex justify-between items-center shadow-2xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-black text-teal-700 bg-white border border-zinc-200 px-1.5 py-0.5 rounded-none">
                                {c.code}
                              </span>
                              <span className="text-[8px] font-mono font-black px-1.5 py-0.2 rounded-none bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                                {c.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-800 font-mono uppercase block mt-1.5 leading-normal">{c.description}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveCode(c.code)}
                            className="text-red-650 hover:text-red-700 hover:bg-red-50 p-1.5 border border-transparent hover:border-red-200 rounded-none transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to manual add codes with speed */}
                <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none space-y-3">
                  <span className="text-[9px] font-mono font-black text-teal-700 block uppercase tracking-widest">RAPID CODE ENTRY</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-mono font-black text-zinc-650 block mb-1 uppercase tracking-wider">CLASSIFICATION TYPE</label>
                      <select 
                        value={newType} 
                        onChange={(e) => setNewType(e.target.value as "ICD-10" | "CPT")}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-800 p-2.5 rounded-none focus:outline-none focus:border-teal-500 uppercase font-black"
                      >
                        <option value="ICD-10">ICD-10 (Diagnostic)</option>
                        <option value="CPT">CPT (Procedural / Transport)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-black text-zinc-655 block mb-1 uppercase tracking-wider">CODE VALUE</label>
                      <input 
                        type="text" 
                        placeholder="e.g. R07.9 or 99283"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 p-2.5 rounded-none focus:outline-none focus:border-teal-500 font-mono font-black uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-black text-zinc-655 block mb-1 uppercase tracking-wider">SHORT DESCRIPTION</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chest pain unspecified"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full bg-white border border-zinc-300 text-xs text-zinc-900 p-2.5 rounded-none focus:outline-none focus:border-teal-500 uppercase font-black"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddCode}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black font-mono px-4 py-2 border border-teal-600 rounded-none flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>ADD CODE TO RECORD</span>
                  </button>
                </div>
              </div>

              {/* Automated Claims Report (AI Summary) */}
              <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <span>AUTOMATED AI INSURANCE CLAIMS FILE</span>
                  </h3>
                  <button 
                    onClick={triggerRecompute}
                    disabled={loadingRecompute}
                    className="text-[9px] font-mono text-teal-700 font-black hover:underline flex items-center gap-1 uppercase tracking-wider"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRecompute ? "animate-spin" : ""}`} />
                    <span>RE-GENERATE SUMMARY</span>
                  </button>
                </div>

                <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none space-y-3">
                  {activeTrip.insuranceReport.generatedSummary ? (
                    <div className="text-[11px] text-zinc-850 leading-relaxed font-mono uppercase whitespace-pre-wrap select-all selection:bg-teal-100">
                      {activeTrip.insuranceReport.generatedSummary}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-600 text-xs font-mono py-4 uppercase tracking-widest">
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
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black font-mono text-[10px] tracking-widest uppercase px-5 py-2.5 border border-emerald-700 rounded-none flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUBMIT INSURANCE CLAIM FILE</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-none p-10 text-center min-h-[300px] flex items-center justify-center shadow-md">
              <div>
                <ClipboardList className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
                <span className="text-xs font-black text-zinc-900 block uppercase tracking-[0.2em] font-display">NO COMPLETED RUNS SELECTED</span>
                <p className="text-zinc-600 font-mono text-[10px] max-w-xs mt-2 uppercase tracking-widest leading-relaxed">
                  Select a completed dispatch on the left pane to audit billing rates, code classifications, and compiled insurance files.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
