import { ApplicationStatus } from "../../../../core/constants/application.const";
import { DashboardStatusCounts } from "../../../../core/models/application.model";

export interface KpiCardItem {
  title: string;
  status: ApplicationStatus | 'ALL';
  countKey: keyof DashboardStatusCounts;
  subtitle: string;
  titleClass: string;
  countClass: string;
}
