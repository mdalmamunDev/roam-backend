import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import TowTruck from './tow truck.model';
import { TowTruckService } from './tow truck.service';
import { UserService } from '../user/user.service';
import { validateFileAndGetName } from '../../helpers/validateHelper';


class Controller {
  // Basic Info handler
  basicInfo = catchAsync(async (req, res) => {
    // req.body.profileImage = validateFileAndGetName(req);
    const { profileImage, name, address, phone, ppm, llc, step } = req.body;

    const userId = req.user?.userId;

    // Update user profile
    const user = await UserService.updateUser(userId, { profileImage, name, address, phone, step });
    // Upsert towTruck data
    const towTruck = await TowTruck.findOneAndUpdate(
      { userId },
      { ppm, llc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    if (!towTruck) {
      return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong', });
    }

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Tow Truck basic info stored successfully', data: { ...towTruck, ...user } });
  });

  updateStep = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    const payload = req.body;

    const user = await UserService.updateUser(userId, { step: payload.step });
    const towTruck = await TowTruckService.updateTowTruck(userId, payload);

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck updated successfully.', data: { ...towTruck, ...user } })
  });

  updateLicensing = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    const payload = req.body;

    const user = await UserService.updateUser(userId, { step: payload.step });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.usDotFile?.[0]) {
      payload.usDotFile = files.usDotFile[0].filename;
    }
    if (files?.policyFile?.[0]) {
      payload.policyFile = files.policyFile[0].filename;
    }
    if (files?.mcFile?.[0]) {
      payload.mcFile = files.mcFile[0].filename;
    }

    const towTruck = await TowTruckService.updateTowTruck(userId, payload);

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck updated successfully.', data: { ...towTruck, ...user } })
  });

  updateBusinessReqArg = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    const payload = req.body;

    const user = await UserService.updateUser(userId, { step: payload.step });

    // payload.authSignature = validateFileAndGetName(req);
    const towTruck = await TowTruckService.updateTowTruck(req.user?.userId, payload);

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow truck updated successfully.', data: { ...towTruck, ...user } })
  });
}

const TowTruckController = new Controller();
export default TowTruckController;

