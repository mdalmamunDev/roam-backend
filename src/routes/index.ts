import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { SettingsRoutes } from '../modules/settings/settings.routes';
import { ExperienceRoutes } from '../modules/experiences/experiences.routes';
import { UploadRoutes } from '../modules/upload/upload.routes';
import { JobRoutes } from '../modules/jobs/jobs.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { MessageRoutes } from '../modules/messages/messages.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
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
    path: '/tow-truck',
    route: TowTruckRoutes,
  },
  {
    path: '/job',
    route: JobRoutes,
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
