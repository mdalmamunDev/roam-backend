export type Role = 'admin' | 'user' | 'provider';
export const UserRole: Role[] = ['admin', 'user', 'provider'];

export type TUserStatus = 'verified' | 'rejected' | 'pending';
export const UserStatus: TUserStatus[] = ['verified', 'rejected', 'pending'];

export type TGender = 'male' | 'female' | 'other';
export const Gender: TGender[] = ['male', 'female', 'other'];

export type TGeoLocation = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};
