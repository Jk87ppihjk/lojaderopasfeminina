import React from 'react';
import { ShoppingBag, Menu, X, Heart, User } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  cartItemCount: number;
  toggleCart: () => void;
  setViewState: (view: ViewState) => void;
}

export const Header: React.FC<HeaderProps> = ({ cartItemCount, toggleCart, setViewState }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="fixed w-full z-50 bg-rosy-black/90 backdrop-blur-md border-b border-rosy-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => setViewState(ViewState.HOME)}>
            <h1 className="font-serif text-3xl text-rosy-red tracking-wider font-bold">
              Rosy<span className="text-white">Modas</span>
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button onClick={() => setViewState(ViewState.HOME)} className="text-gray-300 hover:text-rosy-red px-3 py-2 transition-colors font-sans">Início</button>
              <button onClick={() => setViewState(ViewState.CATALOG)} className="text-gray-300 hover:text-rosy-red px-3 py-2 transition-colors font-sans">Coleção</button>
              <button className="text-gray-300 hover:text-rosy-red px-3 py-2 transition-colors font-sans">Sobre</button>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6">
            <button className="text-gray-400 hover:text-rosy-red transition-colors hidden sm:block">
              <Heart size={24} />
            </button>
            
            <button 
              className="text-white hover:text-rosy-red transition-colors relative"
              onClick={toggleCart}
            >
              <ShoppingBag size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rosy-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-400 hover:text-white">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden bg-rosy-black border-b border-rosy-dark">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => {setViewState(ViewState.HOME); setIsMenuOpen(false);}} className="text-gray-300 hover:text-rosy-red block px-3 py-2 text-base font-medium w-full text-left">Início</button>
            <button onClick={() => {setViewState(ViewState.CATALOG); setIsMenuOpen(false);}} className="text-gray-300 hover:text-rosy-red block px-3 py-2 text-base font-medium w-full text-left">Coleção</button>
            <button 
              onClick={() => {setViewState(ViewState.LOGIN); setIsMenuOpen(false);}} 
              className="text-gray-300 hover:text-rosy-red block px-3 py-2 text-base font-medium w-full text-left flex items-center gap-2 border-t border-rosy-dark mt-2 pt-3"
            >
               <User size={18} /> Área do Lojista
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};