import { pool } from '../config/database.js';
import * as PaymentService from '../services/paymentService.js';
import * as EmailService from '../services/emailService.js';

export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_name, customer_email, customer_address, items } = req.body;

    // 1. Calculate Total
    let total_amount = 0;
    for (const item of items) {
      // In a real app, fetch price from DB to prevent tampering
      total_amount += item.price * item.quantity;
    }

    // 2. Insert Order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, customer_email, customer_address, total_amount) VALUES (?, ?, ?, ?)',
      [customer_name, customer_email, customer_address, total_amount]
    );
    const orderId = orderResult.insertId;

    // 3. Insert Items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.quantity, item.price]
      );
    }

    await connection.commit();

    // 4. Create Payment Link
    const orderData = { id: orderId, customer_name, customer_email, total_amount, items };
    const payment = await PaymentService.createPaymentLink(orderData);

    // Update order with payment info
    await pool.query(
      'UPDATE orders SET payment_provider = ?, payment_link = ?, external_id = ? WHERE id = ?',
      [payment.provider, payment.url, payment.id, orderId]
    );

    // 5. Send Confirmation Email (Async)
    EmailService.sendOrderConfirmation(orderData, items.map(i => ({...i, product_name: i.name, price_at_time: i.price})));

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      paymentUrl: payment.url
    });

  } catch (error) {
    await connection.rollback();
    console.error('Order Creation Failed:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
};