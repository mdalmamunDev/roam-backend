import { Types } from 'mongoose';

export type IReportStatus= 'pending' | 'solved' | 'ignored';
export const ReportStatus: IReportStatus[] = ['pending', 'solved', 'ignored'];

interface IReport {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  providerId: Types.ObjectId;
  jobId: Types.ObjectId;
  reason: string;
  status: IReportStatus;
}

export default IReport;
