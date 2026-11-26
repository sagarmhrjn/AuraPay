export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BusinessType =
  | 'PVT_LTD'
  | 'PUBLIC_LTD'
  | 'PARTNERSHIP'
  | 'SOLE_PROP'
  | 'LLC'
  | 'C_CORP'
  | 'S_CORP';