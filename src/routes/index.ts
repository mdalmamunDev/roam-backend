import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { SettingsRoutes } from '../modules/settings/settings.routes';
import { ExperienceRoutes } from '../modules/experiences/experiences.routes';
import { ToolRoutes } from '../modules/tools/tool.routes';
import { UploadRoutes } from '../modules/upload/upload.routes';
import { CarModelRoutes } from '../modules/car models/car models.routes';
import { JobRoutes } from '../modules/jobs/jobs.routes';
import { ServiceRoutes } from '../modules/services/services.routes';
import { JobProcessRoutes } from '../modules/Job processes/job processes.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { MessageRoutes } from '../modules/messages/messages.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { MechanicRoutes } from '../modules/mechanic/mechanic.routes';
import { TowTruckRoutes } from '../modules/tow truck/tow truck.routes';
import { DashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { BalanceRoutes } from '../modules/balance/balance.routes';
const router = express.Router();

const apiRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/mechanic',
    route: MechanicRoutes,
  },
  {
    path: '/tow-truck',
    route: TowTruckRoutes,
  },
  {
    path: '/job',
    route: JobRoutes,
  },
  {
    path: '/job-process',
    route: JobProcessRoutes,
  },
  {
    path: '/setting',
    route: SettingsRoutes,
  },
  {
    path: '/experience',
    route: ExperienceRoutes,
  },
  {
    path: '/tool',
    route: ToolRoutes,
  },
  {
    path: '/car-model',
    route: CarModelRoutes,
  },
  {
    path: '/service',
    route: ServiceRoutes,
  },
  {
    path: '/upload',
    route: UploadRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes
  },
  {
    path: '/message',
    route: MessageRoutes
  },
  {
    path: '/payment',
    route: PaymentRoutes
  },
  {
    path: '/dashboard',
    route: DashboardRoutes
  },
  {
    path: '/balance',
    route: BalanceRoutes
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
