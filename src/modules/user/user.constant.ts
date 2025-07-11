export type Role = 'admin' | 'user' | 'provider';
export const UserRole: Role[] = ['admin', 'user', 'provider'];

export type TUserStatus = 'active' | 'inactive';
export const UserStatus: TUserStatus[] = ['active', 'inactive'];

export type TGender = 'male' | 'female' | 'other';
export const Gender: TGender[] = ['male', 'female', 'other'];

export type TGeoLocation = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};
