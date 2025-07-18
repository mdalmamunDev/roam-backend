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
import { TowTypesRoutes } from '../modules/tow type/tow type.routes';
import { PromoRoutes } from '../modules/promo/promo.routes';
import { ReportRoutes } from '../modules/report/report.routes';
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
    path: '/tow-type',
    route: TowTypesRoutes,
  },
  {
    path: '/promo',
    route: PromoRoutes,
  },
  {
    path: '/report',
    route: ReportRoutes,
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
