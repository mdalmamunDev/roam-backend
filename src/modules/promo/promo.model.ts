import mongoose, { Schema } from 'mongoose';
import IPromo, { PromoTypes, PromoStatus } from './promo.interface';

const promoSchema = new Schema<IPromo>(
  {
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    type: {
      type: String,
      enum: PromoTypes,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    expireDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: PromoStatus,
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

const Promo = mongoose.model<IPromo>('Promo', promoSchema);
export default Promo;
