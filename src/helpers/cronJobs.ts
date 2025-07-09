import cron from 'node-cron';
import { PaymentService } from '../modules/payment/payment.service';
import { logger } from '../shared/logger';
import colors from 'colors';

export function startCronJobs() {
    // cron.schedule('0 * * * *', async () => {
    //     logger.info(colors.green('🚀 Cron job running every hour - ' + new Date().toLocaleString()));

    //     const trCount = await PaymentService.transferToProviderAll();
    //     logger.info(colors.blue(`Transfer to provider completed for ${trCount} providers.`));
    // });

    // // Example: Run daily at 9 AM
    // cron.schedule('0 9 * * *', async () => {
    //     logger.info(colors.green('🚀 Daily job running at 9 AM - ' + new Date().toLocaleString()));
    //     // Add your daily task here
    // });
}