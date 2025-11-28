import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart }) => {
  return (
    <div className="group relative bg-rosy-dark/30 border border-rosy-dark hover:border-rosy-red/50 transition-all duration-300 rounded-lg overflow-hidden">
      <div className="aspect-[2/3] w-full overflow-hidden bg-gray-900 relative">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        <button
          onClick={() => addToCart(product)}
          className="absolute bottom-4 right-4 bg-rosy-red text-white p-3 rounded-full shadow-lg translate-y-20 group-hover:translate-y-0 transition-transform duration-300 hover:bg-red-700"
          aria-label="Adicionar ao carrinho"
        >
          <Plus size={24} />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-rosy-gray mb-1 uppercase tracking-wide text-xs">{product.category}</p>
        <h3 className="text-lg font-serif text-white font-medium truncate">{product.name}</h3>
        <p className="mt-2 text-xl font-bold text-rosy-red">
          R$ {product.price.toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
};