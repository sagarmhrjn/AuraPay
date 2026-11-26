import { ApplicationStatus, RiskTier } from '../../../../core/constants/application.const';
import { DropdownOption } from '../../../../shared/components/dropdown/dropdown.model';

export const STATUS_OPTIONS: readonly DropdownOption<ApplicationStatus | 'ALL'>[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'INFO_REQUESTED', label: 'Action Required' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const RISK_TIER_OPTIONS: readonly DropdownOption<RiskTier | 'ALL'>[] = [
  { value: 'ALL', label: 'All Risk Tiers' },
  { value: 'LOW', label: 'Low Risk' },
  { value: 'MEDIUM', label: 'Medium Risk' },
  { value: 'HIGH', label: 'High Risk' },
  { value: 'CRITICAL', label: 'Critical Risk' },
];
