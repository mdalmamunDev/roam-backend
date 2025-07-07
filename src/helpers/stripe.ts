import Stripe from 'stripe';
import { config } from '../config';

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-04-30.basil',
});

export default stripe;