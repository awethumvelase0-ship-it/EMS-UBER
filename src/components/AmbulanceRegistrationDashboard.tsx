/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  Siren, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Plus, Trash2, ShieldCheck, HelpCircle, FileCheck, Info, UserCheck
} from "lucide-react";
import { Ambulance, AmbulanceType, ComplianceDoc } from "../types";

interface AmbulanceRegistrationDashboardProps {
  ambulances: Ambulance[];
  onRegisterAmbulance: (ambulanceData: {
    name: string;
    type: AmbulanceType;
    crew: string[];
    vitalsMonitoringSupported: boolean;
    complianceDocs: ComplianceDoc[];
  }) => Promise<void>;
  onUploadComplianceDoc: (ambulanceId: string, documentData: {
    name: string;
    type: string;
    expiryDate: string;
    fileName: string;
    fileSize: string;
    uploadedAt: string;
  }) => Promise<void>;
}

export default function AmbulanceRegistrationDashboard({
  ambulances,
  onRegisterAmbulance,
  onUploadComplianceDoc
}: AmbulanceRegistrationDashboardProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AmbulanceType>(AmbulanceType.BLS);
  const [crewText, setCrewText] = useState("");
  const [vitalsSupported, setVitalsSupported] = useState(false);
  
  // Compliance document upload states (while registering or globally)
  const [pendingDocs, setPendingDocs] = useState<ComplianceDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docType, setDocType] = useState("State EMS Permit");
  const [expiryDate, setExpiryDate] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for viewing/uploading to an already registered ambulance
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
  
  // Direct compliance document upload states (for registered units)
  const [directDocType, setDirectDocType] = useState("State Board EMS Permit");
  const [directExpiryDate, setDirectExpiryDate] = useState("");
  const [directUploading, setDirectUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateProgress = () => {
    setUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      addUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addUploadedFile(file);
    }
  };

  const addUploadedFile = (file: File) => {
    if (!expiryDate) {
      alert("Please select a document expiration date first.");
      return;
    }
    
    simulateProgress();
    
    const newDoc: ComplianceDoc = {
      id: `doc-${Date.now()}`,
      name: docType,
      type: file.type || "application/pdf",
      expiryDate: expiryDate,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "PENDING"
    };

    setPendingDocs((prev) => [...prev, newDoc]);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePendingDoc = (id: string) => {
    setPendingDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmitAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const crew = crewText
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    await onRegisterAmbulance({
      name,
      type,
      crew,
      vitalsMonitoringSupported: vitalsSupported,
      complianceDocs: pendingDocs
    });

    // Reset Form
    setName("");
    setType(AmbulanceType.BLS);
    setCrewText("");
    setVitalsSupported(false);
    setPendingDocs([]);
    setExpiryDate("");
  };

  const selectedAmbulance = ambulances.find(a => a.id === selectedAmbulanceId);

  return (
    <div className="space-y-8">
      {/* Header and Summary */}
      <div className="bg-white border border-zinc-200 p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600 text-white rounded-none">
              <Siren className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-zinc-900 tracking-wider font-display uppercase">
              Ambulance Operator Registry
            </h1>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
            Register your emergency response vehicles and manage state compliance credentials. 
            All active ambulances must maintain active permits and proof of insurance for automatic dispatch routing.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 p-4 shrink-0 font-mono text-[11px] text-zinc-600">
          <div>
            <div className="font-black text-zinc-900 text-lg">{ambulances.length}</div>
            <div>FLEET VEHICLES</div>
          </div>
          <div className="w-px h-8 bg-zinc-200"></div>
          <div>
            <div className="font-black text-green-600 text-lg">
              {ambulances.filter(a => a.status !== "OUT_OF_SERVICE").length}
            </div>
            <div>COMPLIANT / ACTIVE</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Registration Form & File Upload (Left) */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-white border border-zinc-200 p-6 rounded-none space-y-6 shadow-xs">
            <div className="border-b border-zinc-150 pb-3 flex justify-between items-center">
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest font-display flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>1. Register New Vehicle Unit</span>
              </h2>
              <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5">FORM-1090</span>
            </div>

            <form onSubmit={handleSubmitAmbulance} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block">
                  VEHICLE DESIGNATION / NAME
                </label>
                <input 
                  id="reg-vehicle-name"
                  type="text"
                  placeholder="e.g. ALS Unit 11 (Medic-Omega)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-zinc-300 text-xs text-zinc-950 p-3 rounded-none focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/35 font-bold uppercase tracking-wider"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block">
                    DISPATCH SERVICE LEVEL
                  </label>
                  <select 
                    id="reg-vehicle-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as AmbulanceType)}
                    className="w-full bg-white border border-zinc-300 text-xs text-zinc-950 p-3 rounded-none focus:outline-none focus:border-red-600 font-bold"
                  >
                    <option value={AmbulanceType.BLS}>BLS (Basic Life Support - EMT Level)</option>
                    <option value={AmbulanceType.ALS}>ALS (Advanced Life Support - Paramedic Level)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block">
                    ON-BOARD CREW MEMBERS (COMMA SEPARATED)
                  </label>
                  <input 
                    id="reg-vehicle-crew"
                    type="text"
                    placeholder="e.g. EMT Alex Mercer, Paramedic Jane Doe"
                    value={crewText}
                    onChange={(e) => setCrewText(e.target.value)}
                    className="w-full bg-white border border-zinc-300 text-xs text-zinc-950 p-3 rounded-none focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2 border-y border-zinc-100">
                <input 
                  id="reg-vitals-support"
                  type="checkbox"
                  checked={vitalsSupported}
                  onChange={(e) => setVitalsSupported(e.target.checked)}
                  className="w-4.5 h-4.5 text-red-600 border-zinc-300 rounded-none focus:ring-red-500 bg-white"
                />
                <label htmlFor="reg-vitals-support" className="text-xs font-bold text-zinc-700 select-none cursor-pointer">
                  Supports Real-Time Biometric Bluetooth Vitals Streaming (ALS default)
                </label>
              </div>

              {/* Compliance Documents Upload Inside Form */}
              <div className="space-y-3.5 bg-zinc-50 p-4 border border-zinc-200">
                <div>
                  <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                    COMPLIANCE DOCUMENTS UPLOAD
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Drag or select files to fulfill compliance vetting. State boards require continuous licensing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 font-black uppercase">DOCUMENT TYPE</label>
                    <select
                      id="upload-doc-type"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-white border border-zinc-350 text-[11px] p-2 rounded-none font-bold text-zinc-900"
                    >
                      <option value="State EMS Permit">State Board EMS Permit (Form-C)</option>
                      <option value="Vehicle Safety Inspection">Safety Inspection Certificate</option>
                      <option value="General Liability Insurance">Liability Insurance Policy</option>
                      <option value="DEA Controlled Substances Permit">DEA Controlled Substances Permit</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 font-black uppercase">EXPIRATION DATE</label>
                    <input
                      id="upload-doc-expiry"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-white border border-zinc-350 text-[11px] p-2 rounded-none text-zinc-900 font-bold"
                    />
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  id="compliance-drag-drop-zone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed p-6 rounded-none flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    dragActive 
                      ? "border-red-500 bg-red-50/55" 
                      : "border-zinc-300 hover:border-zinc-400 bg-white"
                  }`}
                >
                  <input 
                    id="compliance-file-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />
                  <UploadCloud className="w-8 h-8 text-zinc-400 animate-bounce" />
                  <div className="text-center">
                    <span className="text-xs font-black text-zinc-800 uppercase block tracking-wider">
                      Drag & Drop Compliance File
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                      or click to browse from device (PDF, JPEG up to 10MB)
                    </span>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-1 bg-white border border-zinc-200 p-3">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-600 uppercase font-black">Encrypting and uploading:</span>
                      <span className="font-bold text-red-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1 rounded-none overflow-hidden">
                      <div className="bg-red-600 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* List of Pending Documents to register */}
                {pendingDocs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[9px] font-mono text-zinc-500 font-black uppercase tracking-wider block">PENDING REGISTRATION ATTACHMENTS ({pendingDocs.length}):</span>
                    <div className="space-y-1.5">
                      {pendingDocs.map((doc) => (
                        <div key={doc.id} className="bg-white border border-zinc-200 p-2.5 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-red-600" />
                            <div>
                              <div className="font-black text-zinc-950 uppercase text-[10px]">{doc.name}</div>
                              <div className="text-[9px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <span>File: {doc.fileName}</span>
                                <span>•</span>
                                <span>Size: {doc.fileSize}</span>
                                <span>•</span>
                                <span className="text-amber-700 bg-amber-50 px-1 border border-amber-100">EXP: {doc.expiryDate}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingDoc(doc.id)}
                            className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <button
                id="submit-register-ambulance"
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3.5 px-6 rounded-none transition-all uppercase tracking-widest border border-red-700 font-display shadow-md disabled:opacity-50"
              >
                AUTHORIZE & REGISTER VEHICLE UNIT
              </button>
              
            </form>
          </div>

        </div>

        {/* Registered Fleets & Details (Right) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* List of registered ambulances */}
          <div className="bg-white border border-zinc-200 p-6 rounded-none shadow-xs space-y-4">
            <div className="border-b border-zinc-150 pb-3 flex justify-between items-center">
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest font-display flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>2. Active Operator Fleet</span>
              </h2>
              <span className="text-[9px] font-mono font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5">VETTED ACTIVE</span>
            </div>

            <div className="space-y-3">
              {ambulances.map((amb) => {
                const docCount = amb.complianceDocs?.length || 0;
                const outOfService = amb.status === "OUT_OF_SERVICE";
                return (
                  <div 
                    key={amb.id}
                    className={`border p-4 rounded-none transition-all cursor-pointer ${
                      selectedAmbulanceId === amb.id 
                        ? "bg-red-50/20 border-red-500 ring-1 ring-red-500/25" 
                        : "bg-white border-zinc-200 hover:border-zinc-300"
                    }`}
                    onClick={() => setSelectedAmbulanceId(amb.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-wide text-zinc-950 flex items-center gap-1.5">
                          <Siren className="w-3.5 h-3.5 text-zinc-600" />
                          <span>{amb.name}</span>
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-2 font-mono text-[9px] text-zinc-500">
                          <span className={`px-1.5 py-0.5 border ${
                            amb.type === AmbulanceType.ALS 
                              ? "bg-red-100/60 text-red-800 border-red-200" 
                              : "bg-blue-100/60 text-blue-800 border-blue-200"
                          } font-black`}>
                            {amb.type} SERVICE
                          </span>
                          <span className={`px-1.5 py-0.5 border ${
                            outOfService 
                              ? "bg-zinc-100 text-zinc-500 border-zinc-300" 
                              : "bg-green-100/60 text-green-800 border-green-200"
                          } font-black`}>
                            {amb.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 font-mono text-[9px] font-black uppercase ${
                          docCount > 0 
                            ? "bg-green-100 text-green-800 border border-green-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {docCount > 0 ? "★ COMPLIANT" : "⚠️ NO PAPERS"}
                        </span>
                        <div className="text-[9px] text-zinc-400 font-mono mt-1 font-bold">{docCount} Docs Uploaded</div>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                      <div>
                        <span className="font-bold text-zinc-900 block">CREW ACTIVE:</span>
                        <span className="text-[9px] block text-zinc-500">{amb.crew.join(", ") || "No crew logged"}</span>
                      </div>
                      <span className="text-red-700 font-black hover:underline uppercase text-[9px]">DOCS &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance Viewer Box for Selected Ambulance */}
          {selectedAmbulance ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-zinc-200 p-6 rounded-none shadow-xs space-y-4"
            >
              <div className="border-b border-zinc-150 pb-2.5">
                <span className="text-[9px] font-mono font-black text-red-600 block uppercase">VEHICLE CREDENTIALING AUDIT</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display">{selectedAmbulance.name}</h3>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider block">COMPLIANCE RECORDS:</span>
                
                {selectedAmbulance.complianceDocs && selectedAmbulance.complianceDocs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAmbulance.complianceDocs.map((doc) => (
                      <div key={doc.id} className="border border-zinc-200 p-3 bg-zinc-50/50 flex items-start justify-between gap-4 font-mono text-xs">
                        <div className="space-y-1">
                          <div className="font-black text-zinc-950 uppercase text-[10px] flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-green-600" />
                            <span>{doc.name}</span>
                          </div>
                          <div className="text-[9px] text-zinc-500 space-y-0.5">
                            <div>File: {doc.fileName} ({doc.fileSize})</div>
                            <div>Uploaded On: {doc.uploadedAt}</div>
                            <div className="font-bold text-red-700">Expires: {doc.expiryDate}</div>
                          </div>
                        </div>

                        <span className="bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 text-[9px] font-black uppercase">
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-amber-300 p-4 bg-amber-50 text-center space-y-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                    <div>
                      <div className="text-xs font-black text-amber-950 uppercase tracking-wider">No Compliance Records Active</div>
                      <p className="text-[10px] text-amber-800/80 mt-1">
                        Please upload required permits for this vehicle using the registration panel. Under state law, unverified vehicles will not receive automatic dispatch tasks.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct upload section for selected ambulance */}
              <div className="bg-zinc-50 border border-zinc-200 p-4 space-y-3.5">
                <span className="text-[10px] font-mono font-black text-zinc-800 uppercase tracking-wider block">
                  ➕ UPLOAD ADDITIONAL COMPLIANCE FILE TO THIS UNIT
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 font-black uppercase">DOCUMENT TYPE</label>
                    <select
                      value={directDocType}
                      onChange={(e) => setDirectDocType(e.target.value)}
                      className="bg-white border border-zinc-350 text-[11px] p-2 rounded-none font-bold text-zinc-900 w-full"
                    >
                      <option value="State Board EMS Permit">State Board EMS Permit (Form-C)</option>
                      <option value="Safety Inspection Certificate">Safety Inspection Certificate</option>
                      <option value="Liability Insurance Policy">Liability Insurance Policy</option>
                      <option value="DEA Controlled Substances Permit">DEA Controlled Substances Permit</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 font-black uppercase">EXPIRATION DATE</label>
                    <input
                      type="date"
                      value={directExpiryDate}
                      onChange={(e) => setDirectExpiryDate(e.target.value)}
                      className="bg-white border border-zinc-350 text-[11px] p-2 rounded-none text-zinc-900 font-bold w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="file"
                    id={`direct-file-input-${selectedAmbulance.id}`}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        if (!directExpiryDate) {
                          alert("Please select a document expiration date first.");
                          return;
                        }
                        const file = e.target.files[0];
                        setDirectUploading(true);
                        // Simulate progress/encryption delay
                        setTimeout(async () => {
                          const docObj = {
                            name: directDocType,
                            type: file.type || "application/pdf",
                            expiryDate: directExpiryDate,
                            fileName: file.name,
                            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                            uploadedAt: new Date().toISOString().split("T")[0]
                          };
                          await onUploadComplianceDoc(selectedAmbulance.id, docObj);
                          setDirectUploading(false);
                          setDirectExpiryDate("");
                        }, 800);
                      }
                    }}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`direct-file-input-${selectedAmbulance.id}`)?.click()}
                    disabled={directUploading}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[9px] font-black uppercase px-4 py-2.5 border border-zinc-950 rounded-none w-full text-center flex items-center justify-center gap-2 tracking-widest disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>{directUploading ? "ENCRYPTING COMPLIANCE FILE..." : "SELECT & UPLOAD COMPLIANCE CERTIFICATE"}</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 border border-zinc-200 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-zinc-600" />
                  <span className="text-[10px] font-mono font-black text-zinc-800 uppercase tracking-wider">Vetting Procedures</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Compliance documents are audited automatically using the AI Core engine with final verification by state EMS marshals. Active vetting permits state-wide HIPAA protected access codes.
                </p>
              </div>

            </motion.div>
          ) : (
            <div className="bg-zinc-100 border border-zinc-200 p-6 text-center text-zinc-500 font-mono text-xs">
              Select an ambulance unit above to audit its compliance papers and file certifications.
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
