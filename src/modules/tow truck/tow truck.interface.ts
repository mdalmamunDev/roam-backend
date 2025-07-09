import { Types } from 'mongoose';

interface ITowTruck {
  userId: Types.ObjectId;
  ppm: number; // price per mile
  llc: string; // Partner with LLC for Reliable Towing Service
  companyName: string;
  companyOwner: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  website: string;
  yearsInBusiness: number; // years in business
  totalTows: number;
  einNo: string;
  usDotNo: string;
  usDotFile: string;
  policyNo: string;
  policyLimit: number; // coverage limit
  policyFile: string;
  mcNo: string;
  mcFile: string;
  services: string[];
  primaryCity: string;
  primaryCountry: string;
  regionsCovered: string;
  emergency24_7: boolean;
  eta: string; // estimated time of arrival
  authName: string;
  authTitle: string;
  authSignature: string; // image path
  authDate: string; // Store day, month, and year
}

export default ITowTruck;
