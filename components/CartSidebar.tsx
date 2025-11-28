import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  removeFromCart, 
  updateQuantity,
  onCheckout
}) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-rosy-black border-l border-rosy-dark shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-rosy-dark">
            <h2 className="text-2xl font-serif text-white flex items-center gap-2">
              <ShoppingBag className="text-rosy-red" /> 
              Sua Sacola
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <p className="mb-4">Sua sacola está vazia.</p>
                <button onClick={onClose} className="text-rosy-red underline">Continuar comprando</button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md border border-rosy-dark">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-white">
                        <h3>{item.name}</h3>
                        <p className="ml-4 text-rosy-red">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border border-rosy-dark rounded">
                        <button 
                          className="px-2 py-1 text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, -1)}
                        >-</button>
                        <span className="px-2 text-white">{item.quantity}</span>
                        <button 
                          className="px-2 py-1 text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, 1)}
                        >+</button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="font-medium text-gray-500 hover:text-rosy-red transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-rosy-dark p-6 bg-rosy-black">
              <div className="flex justify-between text-base font-medium text-white mb-4">
                <p>Total</p>
                <p className="text-xl text-rosy-red">R$ {total.toFixed(2).replace('.', ',')}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 mb-6">
                Frete calculado no checkout.
              </p>
              <button
                onClick={onCheckout}
                className="flex w-full items-center justify-center rounded-md border border-transparent bg-rosy-red px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                Finalizar Compra
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};