import { config } from "../config";
import axios from 'axios';

const paymentApi = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${config.pay?.secretKey}`,
    'Content-Type': 'application/json',
  },
});

export default paymentApi