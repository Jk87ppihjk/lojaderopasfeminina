import axios from 'axios';
import { config } from '../config/env.js';

export const sendOrderConfirmation = async (order, items) => {
  if (!config.brevo.apiKey) {
    console.warn('⚠️ Brevo API Key missing. Skipping email.');
    return;
  }

  const itemsListHtml = items.map(item => 
    `<li>${item.quantity}x ${item.product_name} - R$ ${item.price_at_time}</li>`
  ).join('');

  const emailData = {
    sender: { name: "Rosy Modas", email: config.brevo.senderEmail },
    to: [{ email: order.customer_email, name: order.customer_name }],
    subject: `Pedido #${order.id} Confirmado - Rosy Modas`,
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #D90429;">Obrigado pela sua compra!</h1>
          <p>Olá ${order.customer_name},</p>
          <p>Seu pedido <strong>#${order.id}</strong> foi recebido com sucesso.</p>
          
          <h3>Resumo do Pedido:</h3>
          <ul>${itemsListHtml}</ul>
          
          <p><strong>Total: R$ ${order.total_amount}</strong></p>
          
          <p>Assim que o pagamento for confirmado, enviaremos seus produtos.</p>
          
          <br/>
          <p>Atenciosamente,<br/>Equipe Rosy Modas</p>
        </body>
      </html>
    `
  };

  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'api-key': config.brevo.apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`📧 Email sent to ${order.customer_email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.data || error.message);
  }
};