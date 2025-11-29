import { Product } from '../types';

const API_URL = 'https://lojaderopasfeminina.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('rosy_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Falha no login');
    return response.json();
  },

  async getProducts(): Promise<Product[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/products`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || item.image || 'https://via.placeholder.com/400x600',
        description: item.description,
        sizes: item.sizes,
        colors: item.colors,
        stock: item.stock
      }));
    } catch (error) {
      console.warn('API Fetch Error:', error);
      return [];
    }
  },

  async createProduct(productData: any) {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Falha ao criar produto');
    return response.json();
  },

  async updateProduct(id: number, productData: any) {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Falha ao atualizar produto');
    return response.json();
  },

  async deleteProduct(id: number) {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) throw new Error('Falha ao deletar produto');
    return response.json();
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
