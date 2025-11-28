import axios from 'axios';
import { config } from '../config/env.js';

export const createPaymentLink = async (orderData) => {
  const { id, customer_name, customer_email, total_amount, items } = orderData;
  const amountInCents = Math.round(total_amount * 100);

  // 1. Try AbacatePay
  if (config.payment.abacatePaySecret) {
    try {
      console.log('🥑 Creating payment with AbacatePay...');
      const response = await axios.post('https://api.abacatepay.com/v1/billing/create', {
        amount: amountInCents,
        description: `Rosy Modas - Pedido #${id}`,
        customer: {
          name: customer_name,
          email: customer_email,
        },
        returnUrl: `${config.frontendUrl}/checkout/success`,
        completionUrl: `${config.backendUrl}/api/webhooks/abacatepay`,
        frequency: "ONE_TIME" 
      }, {
        headers: {
          'Authorization': `Bearer ${config.payment.abacatePaySecret}`
        }
      });

      return {
        provider: 'ABACATEPAY',
        url: response.data.url, // Adjust based on actual AbacatePay response structure
        id: response.data.id
      };
    } catch (error) {
      console.error('AbacatePay Failed:', error.response?.data || error.message);
      // Continue to next provider
    }
  }

  // 2. Try Mercado Pago
  if (config.payment.mpAccessToken) {
    try {
      console.log('💙 Creating payment with Mercado Pago...');
      const preference = {
        items: items.map(item => ({
          title: item.product_name,
          unit_price: Number(item.price_at_time),
          quantity: item.quantity,
          currency_id: 'BRL'
        })),
        payer: {
          email: customer_email,
          name: customer_name
        },
        external_reference: String(id),
        back_urls: {
          success: `${config.frontendUrl}/checkout/success`,
          failure: `${config.frontendUrl}/checkout/failure`,
          pending: `${config.frontendUrl}/checkout/pending`
        },
        auto_return: 'approved'
      };

      const response = await axios.post('https://api.mercadopago.com/checkout/preferences', preference, {
        headers: {
          'Authorization': `Bearer ${config.payment.mpAccessToken}`
        }
      });

      return {
        provider: 'MERCADOPAGO',
        url: response.data.init_point,
        id: response.data.id
      };
    } catch (error) {
      console.error('Mercado Pago Failed:', error.response?.data || error.message);
    }
  }

  // 3. Fallback / Dev Mode
  console.log('⚠️ No payment provider configured. Returning mock URL.');
  return {
    provider: 'MOCK',
    url: `${config.frontendUrl}/checkout/success?mock=true`,
    id: `mock_${Date.now()}`
  };
};