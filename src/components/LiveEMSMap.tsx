/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Navigation, Hospital, Ambulance as AmbIcon, Heart, MapPin, Activity } from "lucide-react";
import { Ambulance, DispatchTrip } from "../types";

interface LiveEMSMapProps {
  ambulances: Ambulance[];
  activeTrip?: DispatchTrip;
  title?: string;
}

// Convert SF coordinates (Lat 37.7300 - 37.7950, Lng -122.4550 - -122.4000) to percentage SVG coordinates
const convertToPercent = (lat: number, lng: number) => {
  const latMin = 37.7300;
  const latMax = 37.7950;
  const lngMin = -122.4550;
  const lngMax = -122.4000;

  // X maps to longitude
  const x = ((lng - lngMin) / (lngMax - lngMin)) * 80 + 10;
  // Y maps to latitude (inverted)
  const y = 90 - ((lat - latMin) / (latMax - latMin)) * 80;

  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  };
};

export default function LiveEMSMap({ ambulances, activeTrip, title = "San Francisco Emergency Grid" }: LiveEMSMapProps) {
  // Setup destination hospital and patient coords
  const patientCoords = activeTrip ? convertToPercent(activeTrip.gpsCoordinates.lat, activeTrip.gpsCoordinates.lng) : null;
  
  // Destination hospitals definitions
  const hospitals = [
    { name: "Mercy General Trauma Center", lat: 37.7656, lng: -122.4503, desc: "Level 1 Trauma" },
    { name: "St. Jude Cardiac Specialty", lat: 37.7892, lng: -122.4012, desc: "Cardiology & Stroke" },
    { name: "City Community Hospital", lat: 37.7345, lng: -122.4289, desc: "Urgent Intake" },
  ];

  return (
    <div className="relative w-full h-[380px] bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 shadow-md">
      {/* Background Light Grid HUD */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-50 via-zinc-100 to-zinc-200 opacity-90" />
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-[0.12]" 
        style={{
          backgroundImage: "radial-gradient(#0ea5e9 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-250 flex items-center gap-2 shadow-xs">
        <Activity className="w-4 h-4 text-teal-600 animate-pulse" />
        <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest">{title}</span>
      </div>

      {/* Map SVG Canvas */}
      <svg className="w-full h-full p-2 relative z-0 select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* Mock Roads Network - Light/Contrast styled */}
        <g opacity="0.35">
          {/* Main Highway 101 Grid */}
          <line x1="10" y1="20" x2="90" y2="20" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,1" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#94a3b8" strokeWidth="0.5" />
          <line x1="10" y1="80" x2="90" y2="80" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,1" />
          <line x1="20" y1="10" x2="20" y2="90" stroke="#94a3b8" strokeWidth="0.5" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="1,2" />
          <line x1="80" y1="10" x2="80" y2="90" stroke="#94a3b8" strokeWidth="0.5" />
          
          {/* Diagonal Arteries */}
          <line x1="10" y1="10" x2="90" y2="90" stroke="#94a3b8" strokeWidth="0.3" strokeDasharray="3,3" />
          <line x1="90" y1="10" x2="10" y2="90" stroke="#94a3b8" strokeWidth="0.3" />
        </g>

        {/* Route Line if Trip is Active */}
        {activeTrip && activeTrip.ambulanceId && (
          (() => {
            const amb = ambulances.find(a => a.id === activeTrip.ambulanceId);
            if (amb) {
              const ambPt = convertToPercent(amb.location.lat, amb.location.lng);
              const patPt = patientCoords;
              const hospObj = hospitals.find(h => h.name === activeTrip.destinationHospital) || hospitals[0];
              const hospPt = convertToPercent(hospObj.lat, hospObj.lng);

              return (
                <g>
                  {/* Path to patient */}
                  {patPt && (activeTrip.status === "DISPATCHED" || activeTrip.status === "ON_ROUTE") && (
                    <>
                      <line 
                        x1={ambPt.x} y1={ambPt.y} x2={patPt.x} y2={patPt.y} 
                        stroke="#d97706" strokeWidth="0.8" strokeDasharray="1,1"
                        className="animate-pulse"
                      />
                      <path 
                        d={`M ${ambPt.x} ${ambPt.y} Q ${(ambPt.x + patPt.x)/2} ${(ambPt.y + patPt.y)/2 - 5}, ${patPt.x} ${patPt.y}`}
                        fill="none" stroke="#d97706" strokeWidth="0.5" strokeDasharray="2,2"
                      />
                    </>
                  )}
                  {/* Path to hospital */}
                  {patPt && (activeTrip.status === "TRANSPORTING" || activeTrip.status === "ARRIVED") && (
                    <>
                      <line 
                        x1={ambPt.x} y1={ambPt.y} x2={hospPt.x} y2={hospPt.y} 
                        stroke="#0d9488" strokeWidth="0.8" strokeDasharray="1,1"
                      />
                      <path 
                        d={`M ${ambPt.x} ${ambPt.y} Q ${(ambPt.x + hospPt.x)/2} ${(ambPt.y + hospPt.y)/2 - 5}, ${hospPt.x} ${hospPt.y}`}
                        fill="none" stroke="#059669" strokeWidth="0.5" strokeDasharray="2,2"
                      />
                    </>
                  )}
                </g>
              );
            }
            return null;
          })()
        )}

        {/* Plot Hospitals (Green Icons) */}
        {hospitals.map((h, idx) => {
          const pt = convertToPercent(h.lat, h.lng);
          const isTarget = activeTrip?.destinationHospital === h.name;
          return (
            <g key={idx}>
              <circle 
                cx={pt.x} cy={pt.y} r={isTarget ? 3.5 : 2.2} 
                fill={isTarget ? "#059669" : "#e2e8f0"} 
                stroke="#10b981" strokeWidth="0.4" 
              />
              {isTarget && (
                <circle 
                  cx={pt.x} cy={pt.y} r="6" 
                  fill="none" stroke="#10b981" strokeWidth="0.15" 
                  className="animate-ping" style={{ transformOrigin: `${pt.x}px ${pt.y}px` }} 
                />
              )}
            </g>
          );
        })}

        {/* Plot Active Patient Distress Signal */}
        {patientCoords && activeTrip && activeTrip.status !== "COMPLETED" && (
          <g>
            {/* Pulse Rings */}
            <circle 
              cx={patientCoords.x} cy={patientCoords.y} r="8" 
              fill="none" stroke={activeTrip.triageLevel === "RED" ? "#dc2626" : "#d97706"} strokeWidth="0.15" 
              className="animate-ping" style={{ transformOrigin: `${patientCoords.x}px ${patientCoords.y}px` }}
            />
            <circle 
              cx={patientCoords.x} cy={patientCoords.y} r="4" 
              fill="none" stroke={activeTrip.triageLevel === "RED" ? "#dc2626" : "#d97706"} strokeWidth="0.3" 
            />
            <circle 
              cx={patientCoords.x} cy={patientCoords.y} r="1.5" 
              fill={activeTrip.triageLevel === "RED" ? "#dc2626" : "#d97706"} 
            />
          </g>
        )}

        {/* Plot Ambulances */}
        {ambulances.map((amb) => {
          const pt = convertToPercent(amb.location.lat, amb.location.lng);
          const isAssigned = activeTrip?.ambulanceId === amb.id;
          
          let color = "#64748b"; // out of service
          if (amb.status === "AVAILABLE") color = "#0284c7";
          else if (amb.status === "ON_ROUTE") color = "#d97706";
          else if (amb.status === "AT_SCENE") color = "#dc2626";
          else if (amb.status === "TRANSPORTING") color = "#059669";

          return (
            <g key={amb.id}>
              {/* Pulsing selection border */}
              {isAssigned && (
                <circle 
                  cx={pt.x} cy={pt.y} r="5" 
                  fill="none" stroke={color} strokeWidth="0.3" 
                  className="animate-pulse"
                />
              )}
              {/* Main vehicle dot */}
              <circle 
                cx={pt.x} cy={pt.y} r={isAssigned ? 2.5 : 1.8} 
                fill={color} 
                stroke="#ffffff" strokeWidth="0.2" 
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Legends Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-200 grid grid-cols-4 gap-1.5 text-[10px] font-mono text-zinc-600 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 inline-block animate-pulse" />
          <span className="truncate">ER Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-sky-400 inline-block" />
          <span className="truncate">ALS Medic</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400 inline-block" />
          <span className="truncate">BLS Vehicle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 inline-block animate-ping" />
          <span className="truncate text-red-600 font-bold">Distress Pin</span>
        </div>
      </div>

      {/* Render HTML elements relative positioning for clean icons */}
      <div className="absolute top-12 right-3 flex flex-col gap-1.5 z-10">
        {hospitals.map((h, i) => {
          const pt = convertToPercent(h.lat, h.lng);
          const isTarget = activeTrip?.destinationHospital === h.name;
          return (
            <div 
              key={i} 
              className={`text-[9px] px-2 py-0.5 rounded flex items-center gap-1 border ${
                isTarget ? "bg-emerald-50/95 text-emerald-800 border-emerald-200 font-bold shadow-xs" : "bg-white/90 text-zinc-700 border-zinc-200 shadow-xs"
              }`}
            >
              <Hospital className="w-2.5 h-2.5 text-emerald-600" />
              <span>{h.name.split(" ")[0]}</span>
            </div>
          );
        })}
        {activeTrip && activeTrip.status !== "COMPLETED" && (
          <div className="bg-red-50/95 text-red-800 border border-red-200 text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-bold animate-bounce shadow-xs">
            <MapPin className="w-2.5 h-2.5 text-red-600" />
            <span>Emergency (Client)</span>
          </div>
        )}
      </div>
    </div>
  );
}
