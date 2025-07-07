export type Role = 'admin' | 'customer' | 'mechanic' | 'tow_truck';
export const UserRole: Role[] = ['admin', 'customer', 'mechanic', 'tow_truck'];

export type TUserStatus = 'active' | 'delete' | 'block';
export const UserStatus: TUserStatus[] = ['active', 'block', 'delete'];

export type TUserPlatform = 'in shop' | 'on site' | 'both';
export const UserPlatform: TUserPlatform[] = ['in shop', 'on site', 'both'];

export type TTTVehicle = 'flatbed' | 'wrecker' | 'heavy-duty' | 'medium-duty' | 'light-duty' | 'other';
export const TTVehicle: TTTVehicle[] = ['flatbed', 'wrecker', 'heavy-duty', 'medium-duty', 'light-duty', 'other'];

export type TGeoLocation = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};
