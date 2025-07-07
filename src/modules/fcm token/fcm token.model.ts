import { model, Schema } from 'mongoose';
import { IFcmToken } from './fcm token.interface';

const tokenSchema = new Schema<IFcmToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fcmToken: {
    type: String,
    required: [true, 'Token is required'],
  },
});

export const FcmToken = model<IFcmToken>('FcmToken', tokenSchema);
