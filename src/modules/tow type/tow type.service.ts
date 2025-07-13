import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { ObjectId } from 'mongoose';
import TowType from './tow type.model';
import ITowType from './tow type.interface';
import { PromoService } from '../promo/promo.service';

class Service {
  calculatePrices = async (towTypeId: ObjectId | string, distance: number, promoCode : string, userId: ObjectId | string, session: any = undefined): Promise<{amount: number, discount: number, finalAmount: number, charge: number}> => {
    const { baseFare = 0, perKM = 0, charge = 0 } = await TowType.findById(towTypeId) as ITowType;

    const amount = baseFare + perKM * distance;
    let discount = await PromoService.usePromo(promoCode, userId, amount, session)
    const finalAmount = amount - discount + charge;

    return {amount, discount, finalAmount, charge}
  };
}

export const TowTypeService = new Service();
