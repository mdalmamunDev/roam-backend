import { Router } from 'express';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';
import TowTruckController from './tow truck.controller';
import { ValidTT } from './tow truck.validation';
import createUploadMiddleware from '../../middlewares/upload';
import passCustomData from '../../middlewares/passCustomData';

const router = Router();
router.put('/basic-info',
    auth('tow_truck'),
    createUploadMiddleware(20, ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).single('profileImage'),
    validateRequest(ValidTT.updateBasicInfo),
    passCustomData({ step: 2 }),
    TowTruckController.basicInfo
);
router.put('/company-info',
    auth('tow_truck'),
    validateRequest(ValidTT.updateCompanyInfo),
    passCustomData({ step: 3 }),
    TowTruckController.updateStep
);
router.put('/licensing-compliance',
    auth('tow_truck'),
    createUploadMiddleware(20, ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).fields([
        { name: 'usDotFile', maxCount: 1 },
        { name: 'policyFile', maxCount: 1 },
        { name: 'mcFile', maxCount: 1 },
    ]),
    validateRequest(ValidTT.updateLicensingCompliance),
    passCustomData({ step: 4 }),
    TowTruckController.updateLicensing
);
router.put('/vehicles',
    auth('tow_truck'),
    validateRequest(ValidTT.updateVehicleEquVer),
    passCustomData({ step: 5 }),
    TowTruckController.updateStep
);
router.put('/service-coverage',
    auth('tow_truck'),
    validateRequest(ValidTT.updateServiceCovArea),
    passCustomData({ step: 6 }),
    TowTruckController.updateStep
);
router.put('/business-req',
    auth('tow_truck'),
    createUploadMiddleware(20, ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).single('authSignature'),
    validateRequest(ValidTT.updateBusinessReqArg),
    passCustomData({ step: 7 }),
    TowTruckController.updateBusinessReqArg
);

export const TowTruckRoutes = router;
