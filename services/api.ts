import { Product } from '../types';

// Use relative path since backend serves frontend
const API_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('rosy_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper para timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 60000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const api = {
  async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha no login');
      }
      return response.json();
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/products`);

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
      console.warn('API Fetch Error (possivelmente servidor offline ou acordando):', error);
      return [];
    }
  },

  async createProduct(productData: any) {
    const response = await fetchWithTimeout(`${API_URL}/products`, {
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
    const response = await fetchWithTimeout(`${API_URL}/products/${id}`, {
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
    const response = await fetchWithTimeout(`${API_URL}/products/${id}`, {
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

    const response = await fetchWithTimeout(`${API_URL}/checkout`, {
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