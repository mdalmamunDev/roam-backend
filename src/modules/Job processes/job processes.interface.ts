import { Types } from 'mongoose';

// p requested, p-request-cancel, c accepted, c rejected, p confirmed, c paid problems or done, c canceled (c=customer, p=mechanic/tow truck)
export type IJobProcessStatus = 'requested' | 'request-canceled' | 'accepted' | 'rejected' | 'confirmed' | 'denied' | 'serviced' | 'service-rejected' | 'paid' | 'completed' | 'canceled';
export const JobProcessStatus: IJobProcessStatus[] = ['requested', 'request-canceled', 'accepted', 'rejected', 'confirmed', 'denied', 'serviced', 'service-rejected', 'paid', 'completed', 'canceled'];
export const JobProcessStatusRunning: IJobProcessStatus[] = ['requested', 'accepted', 'confirmed', 'serviced', 'paid'];
export const JobProcessStatusFinal: IJobProcessStatus[] = ['accepted', 'confirmed', 'serviced', 'paid', 'completed', 'canceled'];
export const JobProcessStatusDone: IJobProcessStatus[] = ['canceled', 'completed'];
export const JobProcessStatusHistoryCustomer: IJobProcessStatus[] = ['request-canceled', 'rejected', 'denied', 'service-rejected', 'canceled', 'completed'];
export const JobProcessStatusHistoryProvider: IJobProcessStatus[] = ['request-canceled', 'rejected', 'denied', 'serviced', 'service-rejected', 'paid', 'canceled', 'completed'];
export const JobProcessStatusCustomer: IJobProcessStatus[] = ['accepted', 'request-canceled', 'rejected', 'service-rejected', 'paid', 'completed', 'canceled'];
export const JobProcessStatusProvider: IJobProcessStatus[] = ['requested', 'request-canceled', 'confirmed', 'denied', 'serviced'];

export const StatusMap: Record<IJobProcessStatus, IJobProcessStatus[] | undefined> = {
  requested: undefined,
  'request-canceled': ['requested'],
  accepted: ['requested'],
  confirmed: ['accepted'],
  serviced: ['confirmed', 'accepted'],
  paid: ['confirmed', 'serviced'],
  canceled: ['paid'],
  denied: ['requested'],
  rejected: ['accepted'],
  'service-rejected': ['serviced'],
  completed: ['paid'],
};

export interface IJobService {
  serviceId: Types.ObjectId;
  amount: number;
}

interface IJobProcess {
  _id?: Types.ObjectId;
  providerId: Types.ObjectId;
  jobId: Types.ObjectId;
  customerId: Types.ObjectId;
  services: IJobService[];
  servicePrice: number;
  status: IJobProcessStatus;
  rating: number;
  comment: string;
}

export default IJobProcess;
