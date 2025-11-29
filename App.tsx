import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { ChatBot } from './components/ChatBot';
import { Product, CartItem, ViewState } from './types';
import { ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from './services/api';
import { geminiService } from './services/geminiService';

function App() {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  // Checkout States
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      const data = await api.getProducts();
      setProducts(data);
      geminiService.setProducts(data);
      setIsLoadingProducts(false);
    };
    loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setViewState(ViewState.CHECKOUT);
  };

  const finalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingOrder(true);
    setCheckoutError('');

    const formData = new FormData(e.target as HTMLFormElement);
    const customerData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      address: formData.get('address'),
    };

    try {
      const response = await api.createOrder(customerData, cart);
      
      if (response.paymentUrl) {
         // Redirect to external payment (MercadoPago/AbacatePay)
         window.location.href = response.paymentUrl;
      } else {
        // Fallback for mock/test
        setOrderComplete(true);
        setCart([]);
        setTimeout(() => {
          setOrderComplete(false);
          setViewState(ViewState.HOME);
        }, 5000);
      }
    } catch (error) {
      console.error(error);
      setCheckoutError('Erro ao processar o pedido. Tente novamente.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const renderHome = () => (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2574&auto=format&fit=crop" 
            alt="Moda Elegante" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-serif text-white font-bold leading-tight mb-6">
              Ousadia em <br/>
              <span className="text-rosy-red">Vermelho e Preto</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-light">
              Descubra a coleção exclusiva que une elegância atemporal e poder moderno. 
              Peças desenhadas para mulheres que não temem destacar-se.
            </p>
            <button 
              onClick={() => setViewState(ViewState.CATALOG)}
              className="bg-rosy-red hover:bg-red-700 text-white px-8 py-4 text-lg font-medium rounded-sm transition-all duration-300 flex items-center gap-2 group"
            >
              Ver Coleção
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="bg-rosy-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Destaques da Temporada</h2>
            <div className="w-24 h-1 bg-rosy-red mx-auto"></div>
          </div>
          
          {isLoadingProducts ? (
            <div className="flex justify-center text-rosy-red">
              <Loader2 className="animate-spin w-10 h-10" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 3).map(product => (
                <ProductCard key={product.id} product={product} addToCart={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="pt-24 pb-20 min-h-screen bg-rosy-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h2 className="text-3xl font-serif text-white">Coleção Completa</h2>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            {['Todos', 'Vestidos', 'Casacos'].map(cat => (
              <button key={cat} className="px-4 py-2 rounded-full border border-rosy-dark text-gray-300 hover:border-rosy-red hover:text-rosy-red transition-colors text-sm">
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {isLoadingProducts ? (
           <div className="flex justify-center items-center h-64 text-rosy-red">
             <Loader2 className="animate-spin w-12 h-12" />
           </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p>Nenhum produto encontrado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} addToCart={addToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCheckout = () => {
    if (orderComplete) {
      return (
        <div className="pt-32 pb-20 min-h-screen bg-rosy-black flex items-center justify-center px-4">
          <div className="bg-rosy-dark/50 p-8 rounded-lg text-center max-w-md w-full border border-rosy-red/30">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-4">Pedido Confirmado!</h2>
            <p className="text-gray-300 mb-6">Obrigado por comprar na Rosy Modas. Você receberá um e-mail com os detalhes.</p>
            <p className="text-sm text-gray-500">Redirecionando para o início...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-24 pb-20 min-h-screen bg-rosy-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif text-white mb-8">Checkout</h2>
          
          {checkoutError && (
            <div className="mb-6 p-4 bg-red-900/30 border border-rosy-red rounded flex items-center gap-2 text-white">
              <AlertCircle size={20} />
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Form */}
            <div>
              <h3 className="text-xl text-white mb-6 border-b border-rosy-dark pb-2">Dados de Entrega</h3>
              <form onSubmit={finalizeOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome</label>
                    <input name="firstName" required type="text" className="w-full bg-rosy-dark border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sobrenome</label>
                    <input name="lastName" required type="text" className="w-full bg-rosy-dark border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Endereço Completo</label>
                  <input name="address" required type="text" className="w-full bg-rosy-dark border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">E-mail</label>
                  <input name="email" required type="email" className="w-full bg-rosy-dark border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none" />
                </div>
                
                <div className="pt-6">
                   <button 
                    type="submit" 
                    disabled={isProcessingOrder}
                    className="w-full bg-rosy-red hover:bg-red-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {isProcessingOrder ? (
                       <>
                        <Loader2 className="animate-spin" size={20}/> Processando...
                       </>
                     ) : 'Pagar e Finalizar'}
                   </button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-rosy-dark/30 p-6 rounded border border-rosy-dark h-fit">
              <h3 className="text-xl text-white mb-6">Resumo do Pedido</h3>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-gray-300 text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-4 flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span className="text-rosy-red">
                  R$ {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen text-gray-100 font-sans selection:bg-rosy-red selection:text-white">
      <Header 
        cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        toggleCart={() => setIsCartOpen(true)}
        setViewState={setViewState}
      />
      
      <main>
        {viewState === ViewState.HOME && renderHome()}
        {viewState === ViewState.CATALOG && renderCatalog()}
        {viewState === ViewState.CHECKOUT && renderCheckout()}
      </main>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        items={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />

      <ChatBot />
      
      {/* Footer */}
      <footer className="bg-rosy-black border-t border-rosy-dark py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
             <h2 className="text-2xl font-serif font-bold text-white">Rosy<span className="text-rosy-red">Modas</span></h2>
             <p className="text-gray-500 text-sm mt-2">© 2024 Rosy Modas. Todos os direitos reservados.</p>
           </div>
           <div className="flex gap-6 text-gray-400">
             <a href="#" className="hover:text-rosy-red transition-colors">Instagram</a>
             <a href="#" className="hover:text-rosy-red transition-colors">Facebook</a>
             <a href="#" className="hover:text-rosy-red transition-colors">Twitter</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default App;