import { KpiCardItem } from '../models/kpi-card-item.model';

export const kpiCards: readonly KpiCardItem[] = [
  {
    title: 'Total',
    status: 'ALL',
    countKey: 'total',
    subtitle: 'All applications',
    titleClass: 'text-muted',
    countClass: 'text-dark',
  },
  {
    title: 'Under Review',
    status: 'UNDER_REVIEW',
    countKey: 'underReview',
    subtitle: 'Awaiting decision',
    titleClass: 'text-primary',
    countClass: 'text-primary',
  },
  {
    title: 'Submitted',
    status: 'SUBMITTED',
    countKey: 'submitted',
    subtitle: 'Ready for assignment',
    titleClass: 'text-info-emphasis',
    countClass: 'text-info-emphasis',
  },
  {
    title: 'Action Req',
    status: 'INFO_REQUESTED',
    countKey: 'infoRequested',
    subtitle: 'Docs pending',
    titleClass: 'text-warning-emphasis',
    countClass: 'text-warning-emphasis',
  },
  {
    title: 'Approved',
    status: 'APPROVED',
    countKey: 'approved',
    subtitle: 'Ready for processing',
    titleClass: 'text-success',
    countClass: 'text-success',
  },
  {
    title: 'Drafts',
    status: 'DRAFT',
    countKey: 'draft',
    subtitle: 'In progress',
    titleClass: 'text-secondary',
    countClass: 'text-secondary',
  },
];

export const KPI_CARDS = kpiCards;
