import { Router } from 'express';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';
import TowTruckController from './tow truck.controller';
import { ValidTT } from './tow truck.validation';
import createUploadMiddleware from '../../middlewares/upload';
import passCustomData from '../../middlewares/passCustomData';

const router = Router();
router.post('/complete-profile',
    auth('provider'),
    // createUploadMiddleware(20, ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).single('profileImage'),
    validateRequest(ValidTT.completeProfile),
    passCustomData({ step: 2 }),
    TowTruckController.completeProfile
);
router.put('/update-nid',
    auth('provider'),
    validateRequest(ValidTT.updateNid),
    TowTruckController.update
);
router.put('/update-license',
    auth('provider'),
    validateRequest(ValidTT.updateDrivingLicense),
    TowTruckController.update
);
router.put('/update-reg',
    auth('provider'),
    validateRequest(ValidTT.updateCarRegistration),
    TowTruckController.update
);
router.put('/update-img',
    auth('provider'),
    validateRequest(ValidTT.updateCarDriverImages),
    TowTruckController.update
);

export const TowTruckRoutes = router;
