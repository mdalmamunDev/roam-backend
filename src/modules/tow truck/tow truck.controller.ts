import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import TowTruck from './tow truck.model';
import { TowTruckService } from './tow truck.service';
import { UserService } from '../user/user.service';
import { validateFileAndGetName } from '../../helpers/validateHelper';


class Controller {
  // Basic Info handler
  completeProfile = catchAsync(async (req, res) => {
    // req.body.profileImage = validateFileAndGetName(req);
    const { profileImage, address, step, companyName, towTypeId, dateOfBirth, gender, description } = req.body;

    const userId = req.user?.userId;

    // Update user profile
    const user = await UserService.updateUser(userId, { profileImage, address, step });
    // Upsert towTruck data
    const towTruck = await TowTruck.findOneAndUpdate(
      { userId },
      { companyName, towTypeId, dateOfBirth, gender, description },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    
    if (!towTruck) {
      return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong', });
    }

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck basic info stored successfully', data: { ...towTruck, ...user } });
  });  update = catchAsync(async (req, res) => {
    // req.body.profileImage = validateFileAndGetName(req);

    const userId = req.user?.userId;

    // Update user profile
    // Upsert towTruck data
    const towTruck = await TowTruck.findOneAndUpdate(
      { userId },
      req.body,
      { new: true }
    ).lean();

    if (!towTruck) {
      return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong', });
    }

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck updated successfully', data: towTruck });
  });
}

const TowTruckController = new Controller();
export default TowTruckController;

