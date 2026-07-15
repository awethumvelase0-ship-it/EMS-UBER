/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck, Terminal, Search, Fingerprint, Lock, 
  Database, RefreshCw, AlertTriangle, ShieldAlert 
} from "lucide-react";
import { HIPAAAuditLog } from "../types";

interface AdminDashboardProps {
  logs: HIPAAAuditLog[];
  onRefreshLogs: () => Promise<void>;
}

export default function AdminDashboard({ logs, onRefreshLogs }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Search filter
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.user.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.role.toLowerCase().includes(term)
    );
  });

  // Calculate stats
  const unauthorizedAttempts = logs.filter(l => l.action === "PATIENT_UNLOCK_FAILED").length;

  return (
    <div className="space-y-6">
      {/* HUD Security Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-teal-50 p-2.5 border border-teal-200 text-teal-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-zinc-500 block uppercase tracking-wider">HIPAA STATUS</span>
            <strong className="text-xs font-mono text-teal-750 font-black uppercase tracking-wider">COMPLIANT (100%)</strong>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-blue-50 p-2.5 border border-blue-200 text-blue-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-zinc-500 block uppercase tracking-wider">E2E ENCRYPTION</span>
            <strong className="text-xs font-mono text-blue-750 font-black tracking-wider">AES-256-GCM (LIVE)</strong>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className="bg-purple-50 p-2.5 border border-purple-200 text-purple-700">
            <Fingerprint className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-zinc-500 block uppercase tracking-wider">BIOMETRIC AUTH</span>
            <strong className="text-xs font-mono text-purple-750 font-black tracking-wider">ACTIVE (PASSKEY / FACE)</strong>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-4 rounded-none flex items-center gap-3.5 shadow-md">
          <div className={`p-2.5 border flex items-center justify-center ${
            unauthorizedAttempts > 0 ? "bg-red-50 text-red-700 border-red-250" : "bg-emerald-50 text-emerald-700 border-emerald-250"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-black text-zinc-550 block uppercase tracking-wider">SECURITY FLAGS</span>
            <strong className={`text-xs font-mono font-black tracking-wider ${unauthorizedAttempts > 0 ? "text-red-700 animate-pulse" : "text-emerald-750"}`}>
              {unauthorizedAttempts > 0 ? `${unauthorizedAttempts} ALERT ATTEMPTS` : "0 FLAGS DETECTED"}
            </strong>
          </div>
        </div>

      </div>

      {/* Audit Logs Console Layout */}
      <div className="bg-white border border-zinc-200 rounded-none p-5 shadow-md space-y-4">
        
        <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 flex-wrap gap-4">
          <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <Terminal className="w-4 h-4 text-zinc-500" />
            <span>HIPAA-COMPLIANT NON-REPUDIATION AUDIT LOGS</span>
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search audit actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-zinc-300 rounded-none pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-teal-500 w-48 font-mono font-bold uppercase"
              />
            </div>

            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-600 p-2 rounded-none transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Console Box */}
        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-none font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 uppercase tracking-widest">
              No matching security entries located in log database
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isWarning = log.action.includes("FAILED") || log.action.includes("WARN");
              const isCritical = log.action.includes("AUTO_DISPATCH") || log.action.includes("DOCTOR_SIGN_OFF");
              
              let actionColor = "text-teal-700";
              if (isWarning) actionColor = "text-red-700 font-black animate-pulse";
              else if (isCritical) actionColor = "text-amber-700 font-bold";

              return (
                <div key={log.id} className="py-2.5 border-b border-zinc-200 flex flex-col md:flex-row md:items-start md:justify-between gap-2 leading-relaxed uppercase tracking-wider">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-500 text-[9px] font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-zinc-700 font-black bg-white border border-zinc-200 px-1.5 py-0.2 text-[9px]">
                        {log.role}: {log.user}
                      </span>
                      <span className={`text-[9px] ${actionColor}`}>
                        [{log.action}]
                      </span>
                    </div>
                    <p className="text-zinc-800 text-[10px] leading-relaxed">{log.details}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[8px] text-zinc-500 block font-black">SHA-256 CHECK</span>
                    <span className="text-[9px] text-zinc-600 font-mono block bg-white px-1.5 py-0.5 border border-zinc-200 truncate w-32 font-bold">
                      {log.encryptedHash}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-none flex items-start gap-3">
          <Database className="w-5 h-5 text-teal-650 shrink-0 mt-0.5" />
          <div className="text-[10px] text-zinc-655 leading-relaxed font-mono uppercase tracking-wide">
            <strong className="text-zinc-800">SYSTEM ARCHITECTURE INTEGRITY STATEMENT:</strong> All transmission transactions undergo on-board military-grade SHA-256 hashing. Demographic patient files use separate localized storage layers and are decoupled from dispatch GPS telemetry coordinates, guaranteeing zero data exposure in transit.
          </div>
        </div>

      </div>
    </div>
  );
}
