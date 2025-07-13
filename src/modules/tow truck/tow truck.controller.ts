import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import TowTruck from './tow truck.model';
import { UserService } from '../user/user.service';
import ApiError from '../../errors/ApiError';
import { User } from '../user/user.model';
import { TUser } from '../user/user.interface';
import { getDistanceInKm } from '../../helpers/globalHelper';
import paginate from '../../helpers/paginationHelper';

class Controller {
  private async getTowTruckOrThrow(userId: string, fields: string) {
    const towTruck = await TowTruck.findOne({ userId }).select(fields).lean();
    if (!towTruck) throw new ApiError(StatusCodes.NOT_FOUND, 'Tow truck not found');
    return towTruck;
  }

  getNearByUser = catchAsync(async (req, res) => {
    const auth = req.user;
    const {
      page = 1,
      limit = 10,
    } = req.query;

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters: {
        _id: { $ne: auth.userId },
        role: 'provider',
        status: 'active',
        location: {
          $geoWithin: {
            $centerSphere: [
              auth.location.coordinates,
              100 / 6371 // 100 km radius, Earth radius in km
            ]
          }
        }
      },
      model: User,
    });


    // 2. Build enriched provider list
    const providers = await Promise.all(
      results.map(async (u: TUser) => {
        if (!u?.location) return null;

        const p = await TowTruck.findOne({
          userId: u._id,
          isVerified: true,
          isOnline: true,
        });

        if (!p) return null;

        const distance = getDistanceInKm(
          auth.location.coordinates,
          u.location.coordinates
        );

        return {
          _id: u._id,
          name: u.name,
          companyName: p.companyName,
          carImage: p.carImage,
          rating: 4.5,
          trips: 102,
          distance: `${distance?.toFixed(2)}km`,
        };
      })
    );

    // 3. Filter nulls and sort by distance
    const sortedProviders = providers
      .filter(Boolean)
      .sort((a: any, b: any) => a.distance - b.distance);

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck profile fetched successfully', data: {providers: sortedProviders, pagination} });
  });


  profile = catchAsync(async (req, res) => {
    const { userId } = req.user;

    const [user, towTruck] = await Promise.all([
      UserService.getSingleUser(userId),
      this.getTowTruckOrThrow(userId, '-userId -nidNo -nidFront -nidBack -drivingLicenseNo -drivingLicenseFront -drivingLicenseBack -carRegistrationNo -carRegistrationFont -carRegistrationBack')
    ]);

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck profile fetched successfully', data: { ...user, ...towTruck } });
  });

  getNid = catchAsync(async (req, res) => {
    const { userId } = req.user;
    const towTruck = await this.getTowTruckOrThrow(userId, 'nidNo nidFront nidBack -_id');
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck NID info fetched successfully', data: towTruck });
  });

  getLicense = catchAsync(async (req, res) => {
    const { userId } = req.user;
    const towTruck = await this.getTowTruckOrThrow(userId, 'drivingLicenseNo drivingLicenseFront drivingLicenseBack -_id');
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck license info fetched successfully', data: towTruck });
  });

  getReg = catchAsync(async (req, res) => {
    const { userId } = req.user;
    const towTruck = await this.getTowTruckOrThrow(userId, 'carRegistrationNo carRegistrationFront carRegistrationBack -_id');
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck car registration fetched successfully', data: towTruck });
  });

  getCarDriverImages = catchAsync(async (req, res) => {
    const { userId } = req.user;
    const towTruck = await this.getTowTruckOrThrow(userId, 'carImage driverImage -_id');
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck car image & driver image fetched successfully', data: towTruck });
  });

  completeProfile = catchAsync(async (req, res) => {
    const { profileImage, address, step, companyName, towTypeId, dateOfBirth, gender, description } = req.body;
    const userId = req.user?.userId;

    const [user, towTruck] = await Promise.all([
      UserService.updateUser(userId, { profileImage, dateOfBirth, address, step }),
      TowTruck.findOneAndUpdate(
        { userId },
        { companyName, towTypeId, gender, description },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean()
    ]);

    if (!user || !towTruck) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to complete profile update' });

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck basic info stored successfully' });
  });

  update = catchAsync(async (req, res) => {
    const userId = req.user?.userId;

    const towTruck = await TowTruck.findOneAndUpdate({ userId }, req.body, { new: true }).lean();

    if (!towTruck) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to update tow truck data' });

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck updated successfully' });
  });

  updateProfile = catchAsync(async (req, res) => {
    const { profileImage, name, phone, address, companyName, towTypeId, dateOfBirth, gender, description } = req.body;
    const userId = req.user?.userId;

    const [user, towTruck] = await Promise.all([
      UserService.updateUser(userId, { profileImage, dateOfBirth, name, phone, address }),
      TowTruck.findOneAndUpdate(
        { userId },
        { companyName, towTypeId, gender, description },
        { new: true }
      ).lean()
    ]);

    if (!user || !towTruck) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to update tow truck profile' });

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck updated successfully' });
  });
}

const TowTruckController = new Controller();
export default TowTruckController;
