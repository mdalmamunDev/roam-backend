import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { ObjectId } from 'mongoose';
import IPromo from './promo.interface';
import Promo from './promo.model';
import moment from 'moment';

class Service {
  getValidPromosByUser = async (userId: ObjectId | string): Promise<IPromo[]> => {
    const promos = await Promo.find({
      users: { $ne: userId },
      expireDate: { $gte: new Date() },
      status: 'active',
    }).select('-users');

    return promos;
  };

  usePromo = async (code: string, userId: ObjectId | string, orderAmount: number, session: any): Promise<number> => {
    if(!code || !userId) return 0;

    const promo = await Promo.findOneAndUpdate(
      {
        code,
        users: { $ne: userId },
        expireDate: { $gte: new Date() },
        status: 'active'
      },
      {
        $push: { users: userId }
      },
      { new: true, session }
    )

    if(!promo) throw new ApiError(StatusCodes.NOT_FOUND, 'Promo code not valid');

    return promo.type === 'percent' ? orderAmount * (promo.value / 100) : promo.value;
  };

 getRecentPromos = async (limit: number) => {
  const promos = await Promo.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit);

  const updatedPromos = promos.map((promo: any) => ({
    ...promo.toObject(),
    usageCount: promo.users?.length || 0,
    ago: moment(promo.createdAt).fromNow(),
    users: undefined,
  }));

  return updatedPromos;
};
}

export const PromoService = new Service();
