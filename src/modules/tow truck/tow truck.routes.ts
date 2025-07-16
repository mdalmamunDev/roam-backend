import { Router } from 'express';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';
import TowTruckController from './tow truck.controller';
import { ValidTT } from './tow truck.validation';
import createUploadMiddleware from '../../middlewares/upload';
import passCustomData from '../../middlewares/passCustomData';

const router = Router();

router.get('/', auth(['user', 'provider']), TowTruckController.getNearByUser);
router.post('/online', auth('provider'), validateRequest(ValidTT.goOnline), TowTruckController.update);

router.post('/complete-profile',
    auth('provider'),
    validateRequest(ValidTT.completeProfile),
    passCustomData({ step: 2 }),
    TowTruckController.completeProfile
);

router.get('/nid', auth('provider'), TowTruckController.getNid );
router.put('/nid',
    auth('provider'),
    validateRequest(ValidTT.updateNid),
    TowTruckController.update
);

router.get('/license', auth('provider'), TowTruckController.getLicense );
router.put('/license',
    auth('provider'),
    validateRequest(ValidTT.updateDrivingLicense),
    TowTruckController.update
);

router.get('/reg', auth('provider'), TowTruckController.getReg );
router.put('/reg',
    auth('provider'),
    validateRequest(ValidTT.updateCarRegistration),
    TowTruckController.update
);

router.get('/img', auth('provider'), TowTruckController.getCarDriverImages );
router.put('/img',
    auth('provider'),
    validateRequest(ValidTT.updateCarDriverImages),
    TowTruckController.update
);

router.get('/profile', auth('provider'), TowTruckController.profile);
router.put('/profile',
    auth('provider'),
    validateRequest(ValidTT.updateProfile),
    TowTruckController.updateProfile
);


router.get('/:userId', auth('admin'), TowTruckController.getProvider);
router.put('/verify/:userId', auth('admin'), validateRequest(ValidTT.updateIsVerified), TowTruckController.verifyProvider);

export const TowTruckRoutes = router;
