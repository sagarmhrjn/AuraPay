import { BusinessType, ApplicationStatus, RiskTier } from "../constants/application.const";

export interface BusinessProfile {
  legalName: string;
  dbaName?: string;
  businessType: BusinessType;
  pan: string; // 9-digit Inland Revenue Department (IRD) PAN
  ein: string; // Compatibility alias
  registrationNumber?: string; // Office of the Company Registrar (OCR) No.
}

export interface PrincipalProfile {
  fullName: string;
  ownershipPercentage: number;
  citizenshipNumber: string; // Nepali Citizenship Certificate No. (नागरिकता नं) / National ID
  ssn: string; // Compatibility alias
}

export interface ProcessingProfile {
  estimatedMonthlyVolume: number; // Monthly transaction volume in NPR (रू)
  averageTicketSize: number; // Average ticket in NPR (रू)
  highTicketSize: number; // High ticket in NPR (रू)
  bankName: string; // NRB-licensed "Class A" Commercial Bank
  bankRoutingNumber: string; // NCHL-IPS / Clearing Member Routing Code (9-digit)
  bankAccountNumber: string; // Settlement Account Number (sensitive)
  currency?: string; // 'NPR'
}

export interface ComplianceRiskProfile {
  termsAccepted: boolean;
  signerFullName: string;
  signedAt: string;
}

export interface RiskDecisionLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'SUBMITTED' | 'ASSIGNED' | 'REQUEST_INFO' | 'APPROVED' | 'REJECTED' | 'APPROVE' | 'REJECT' | 'NOTE_ADDED';
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  note: string;
  assignedTier?: RiskTier;
  approvedLimit?: number; // In NPR
}

export interface RiskAssessment {
  riskScore: number;
  riskTier: RiskTier;
  rejectionReasonCode?: string;
  reviewerNotes?: string;
  decisionHistory: RiskDecisionLog[];
}

export interface MerchantApplication {
  id: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  status: ApplicationStatus;
  salesRepId: string;
  salesRepName: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  businessProfile: BusinessProfile;
  principalProfile: PrincipalProfile;
  processingProfile: ProcessingProfile;
  complianceRisk: ComplianceRiskProfile;
  riskAssessment: RiskAssessment;
}

export interface ApplicationQueryFilter {
  searchTerm?: string;
  status?: ApplicationStatus | 'ALL';
  riskTier?: RiskTier | 'ALL';
  salesRepId?: string;
  assignedReviewerId?: string;
  page: number;
  pageSize: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'legalName' | 'status' | 'riskTier';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedApplicationsResponse {
  items: MerchantApplication[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStatusCounts {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  infoRequested: number;
  approved: number;
  rejected: number;
}

export interface RiskDecisionPayload {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
  note: string;
  riskTier?: RiskTier;
  approvedLimit?: number;
  rejectionReasonCode?: string;
}
