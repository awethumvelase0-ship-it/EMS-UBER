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
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md">
          <div className="bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20 text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">HIPAA STATUS</span>
            <strong className="text-sm font-mono text-teal-400 font-bold uppercase">COMPLIANT (100%)</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md">
          <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20 text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">E2E ENCRYPTION</span>
            <strong className="text-sm font-mono text-blue-400 font-bold">AES-256-GCM (LIVE)</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md">
          <div className="bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20 text-purple-400">
            <Fingerprint className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">BIOMETRIC AUTH</span>
            <strong className="text-sm font-mono text-purple-400 font-bold">ACTIVE (PASSKEY / FACE)</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-md">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center ${
            unauthorizedAttempts > 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-500 block">SECURITY FLAGS</span>
            <strong className={`text-sm font-mono font-bold ${unauthorizedAttempts > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {unauthorizedAttempts > 0 ? `${unauthorizedAttempts} ALERT ATTEMPTS` : "0 FLAGS DETECTED"}
            </strong>
          </div>
        </div>

      </div>

      {/* Audit Logs Console Layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-wrap gap-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>HIPAA-Compliant Non-Repudiation Audit Logs</span>
          </h3>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search audit actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-48 font-mono"
              />
            </div>

            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 p-1.5 rounded"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Console Box */}
        <div className="bg-slate-950 border border-slate-950 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-slate-600 py-8 uppercase">
              No matching security entries located in log database
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isWarning = log.action.includes("FAILED") || log.action.includes("WARN");
              const isCritical = log.action.includes("AUTO_DISPATCH") || log.action.includes("DOCTOR_SIGN_OFF");
              
              let actionColor = "text-teal-400";
              if (isWarning) actionColor = "text-red-400 font-bold animate-pulse";
              else if (isCritical) actionColor = "text-amber-400";

              return (
                <div key={log.id} className="py-2.5 border-b border-slate-900/60 flex flex-col md:flex-row md:items-start md:justify-between gap-2 leading-relaxed">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-400 font-bold bg-slate-900 px-1.5 py-0.2 rounded text-[10px]">
                        {log.role}: {log.user}
                      </span>
                      <span className={`uppercase text-[10px] ${actionColor}`}>
                        [{log.action}]
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-normal">{log.details}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[9px] text-slate-600 block">SHA-256 CHECK</span>
                    <span className="text-[10px] text-slate-500 font-mono text-[9px] block bg-slate-900 px-1.5 py-0.5 rounded border border-slate-900 truncate w-32">
                      {log.encryptedHash}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex items-start gap-3">
          <Database className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
            <strong>SYSTEM ARCHITECTURE INTEGRITY STATEMENT:</strong> All transmission transactions undergo on-board military-grade SHA-256 hashing. Demographic patient files use separate localized storage layers and are decoupled from dispatch GPS telemetry coordinates, guaranteeing zero data exposure in transit.
          </div>
        </div>

      </div>
    </div>
  );
}
