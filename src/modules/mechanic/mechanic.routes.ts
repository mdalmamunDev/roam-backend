import { Router } from 'express';
import { MechanicController } from './mechanic.controller';
import validateRequest from '../../shared/validateRequest';
import { validBasicInfo, validEmploymentHistory, validExperienceCertifications, validReferences, validResumeCertificate, validToolsCustomization, validWhyOnSite } from './mechanic.validation';
import auth from '../../middlewares/auth';
import createUploadMiddleware from '../../middlewares/upload';
import passCustomData from '../../middlewares/passCustomData';

const router = Router();
router.put('/basic-info',
    auth('mechanic'),
    createUploadMiddleware(20, ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).single('profileImageFile'),
    validateRequest(validBasicInfo),
    passCustomData({ step: 2 }),
    MechanicController.basicInfo
);
router.put('/experience-certifications',
    auth('mechanic'),
    validateRequest(validExperienceCertifications),
    passCustomData({ step: 3 }),
    MechanicController.updateMechanicStep
); // experiences[], certification
router.put('/tools',
    auth('mechanic'),
    validateRequest(validToolsCustomization),
    passCustomData({ step: 4 }),
    MechanicController.updateMechanicStep
); // tools[], toolsCustom[] 
router.put('/employment-history',
    auth('mechanic'),
    validateRequest(validEmploymentHistory),
    passCustomData({ step: 5 }),
    MechanicController.updateMechanicStep
);
router.put('/reference',
    auth('mechanic'),
    validateRequest(validReferences),
    passCustomData({ step: 6 }),
    MechanicController.updateMechanicStep
);
router.put('/why-on-site',
    auth('mechanic'),
    validateRequest(validWhyOnSite),
    passCustomData({ step: 7 }),
    MechanicController.updateMechanicStep
);
router.put('/resume-certificate',
    auth('mechanic'),
    createUploadMiddleware(20, ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']).fields([
        { name: 'resumeFile', maxCount: 1 },
        { name: 'certificateFile', maxCount: 1 }
    ]),
    validateRequest(validResumeCertificate),
    passCustomData({ step: 8 }),
    MechanicController.updateMechanicResumeCertificate
);

export const MechanicRoutes = router;
