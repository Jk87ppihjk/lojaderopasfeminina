import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ViewState } from '../types';

interface LoginPanelProps {
  onLoginSuccess: () => void;
  setViewState: (view: ViewState) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess, setViewState }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await api.login(email, password);
      localStorage.setItem('rosy_token', data.token);
      localStorage.setItem('rosy_user', JSON.stringify(data.user));
      onLoginSuccess();
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rosy-black flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full bg-rosy-dark/30 border border-rosy-dark p-8 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-white font-bold mb-2">Área do Lojista</h2>
          <p className="text-gray-400 text-sm">Acesse o painel para gerenciar a Rosy Modas</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-rosy-red text-white p-3 rounded mb-6 flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-600 rounded pl-10 pr-3 py-2 text-white focus:outline-none focus:border-rosy-red transition-colors"
                placeholder="admin@rosymodas.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-600 rounded pl-10 pr-3 py-2 text-white focus:outline-none focus:border-rosy-red transition-colors"
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rosy-red hover:bg-red-700 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setViewState(ViewState.HOME)}
            className="text-gray-500 hover:text-white text-sm"
          >
            Voltar para a Loja
          </button>
        </div>
      </div>
    </div>
  );
};
