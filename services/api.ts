import { Product } from '../types';

// Updated URL as requested
const API_URL = 'https://lojaderopasfeminina.onrender.com/api';

export const api = {
  async getProducts(): Promise<Product[]> {
    try {
      // The backend might not be awake yet, so we handle timeouts/errors gracefully
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_URL}/products`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      // Map backend fields to frontend type
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || item.image || 'https://via.placeholder.com/400x600',
        description: item.description
      }));
    } catch (error) {
      console.warn('API Fetch Error (Backend may be sleeping):', error);
      // Return empty array to allow frontend to render empty state
      return [];
    }
  },

  async createOrder(customerData: any, items: any[]) {
    const orderPayload = {
      customer_name: `${customerData.firstName} ${customerData.lastName}`,
      customer_email: customerData.email,
      customer_address: customerData.address,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    };

    const response = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar pedido');
    }
    
    return response.json();
  }
};