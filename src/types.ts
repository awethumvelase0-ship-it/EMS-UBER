/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TriageLevel {
  GREEN = "GREEN", // Minor / Basic
  YELLOW = "YELLOW", // Urgent / Intermediate
  RED = "RED" // Critical / Unconscious -> Bypasses BLS, routes strictly to ALS
}

export enum AmbulanceType {
  ALS = "ALS", // Advanced Life Support
  BLS = "BLS"  // Basic Life Support
}

export enum AmbulanceStatus {
  AVAILABLE = "AVAILABLE",
  ON_ROUTE = "ON_ROUTE",
  AT_SCENE = "AT_SCENE",
  TRANSPORTING = "TRANSPORTING",
  OUT_OF_SERVICE = "OUT_OF_SERVICE"
}

export enum TripStatus {
  IDLE = "IDLE",
  PANIC_TRIGGERED = "PANIC_TRIGGERED",
  DISPATCHED = "DISPATCHED",
  ON_ROUTE = "ON_ROUTE",
  AT_SCENE = "AT_SCENE",
  TRANSPORTING = "TRANSPORTING",
  ARRIVED = "ARRIVED",
  COMPLETED = "COMPLETED",
  SCHEDULED = "SCHEDULED"
}

export enum UserRole {
  CLIENT = "CLIENT",
  PARAMEDIC = "PARAMEDIC",
  DISPATCHER = "DISPATCHER",
  HOSPITAL = "HOSPITAL",
  BILLING = "BILLING",
  ADMIN = "ADMIN",
  PROVIDER = "PROVIDER"
}

export interface ComplianceDoc {
  id: string;
  name: string;
  type: string;
  expiryDate: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: "VERIFIED" | "PENDING" | "EXPIRED";
}

export interface Ambulance {
  id: string;
  name: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  location: { lat: number; lng: number };
  crew: string[];
  vitalsMonitoringSupported: boolean;
  complianceDocs?: ComplianceDoc[];
}

export interface PatientInfo {
  name: string;
  dob: string;
  gender: string;
  ssnLocked: string; // Encrypted or masked by default
  medicalHistory: string;
  accessCode: string; // 4-digit security PIN to unlock detailed info
}

export interface VitalSign {
  timestamp: string;
  heartRate: number;
  bloodPressure: string; // e.g. "120/80"
  spo2: number; // e.g. 98
  temperature: number; // e.g. 98.6
}

export interface ClinicalRecord {
  vitals: VitalSign[];
  symptoms: string;
  clinicalNotes: string;
}

export interface MedicalCode {
  code: string;
  description: string;
  type: "ICD-10" | "CPT";
}

export interface InsuranceReport {
  insuranceProvider: string;
  policyNumber: string;
  generatedSummary?: string; // AI generated summary of trip
  claimedAmount?: number;
  approved?: boolean;
  claimStatus?: string; // e.g. "APPROVED", "PENDING_REVIEW", "PENDING_SUBMISSION"
}

export interface DoctorSignOff {
  signed: boolean;
  doctorName?: string;
  licenseNumber?: string;
  signedAt?: string;
}

export interface DispatchTrip {
  id: string;
  status: TripStatus;
  triageLevel: TriageLevel;
  callerPhone: string;
  locationName: string;
  gpsCoordinates: { lat: number; lng: number };
  destinationHospital: string;
  ambulanceId?: string;
  patientInfo: PatientInfo;
  clinicalRecord: ClinicalRecord;
  medicalCodes: MedicalCode[];
  insuranceReport: InsuranceReport;
  doctorSignOff: DoctorSignOff;
  timeline: { status: TripStatus; timestamp: string; note: string }[];
  offlineSynced: boolean;
  kilometersCovered?: number;
  equipmentsUsed?: string[];
  isScheduled?: boolean;
  scheduledAt?: string;
}

export interface HIPAAAuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  details: string;
  encryptedHash: string; // SHA-256 integrity hash simulation
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  action: string;
  payload: any;
  status: "pending" | "synced" | "failed";
}
