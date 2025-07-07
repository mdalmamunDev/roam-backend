import { Types } from 'mongoose';

export type TMechanicRelation = 'supervisor' | 'co-worker' | 'other';
export const MechanicRelations: TMechanicRelation[] = [
  'supervisor',
  'co-worker',
  'other',
];

interface IMechanicReferences {
  name: string;
  phone: string;
  relation: TMechanicRelation;
}

export default IMechanicReferences;
