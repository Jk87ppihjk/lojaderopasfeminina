import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, X, Upload, Save, Search } from 'lucide-react';
import { ViewState } from '../types';

interface AdminPanelProps {
  setViewState: (view: ViewState) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ setViewState }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await api.getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setCurrentProduct({
        ...product,
        // Convert numbers to form string values if needed, though inputs handle type coercion
      });
    } else {
      setIsEditing(false);
      setCurrentProduct({
        name: '',
        description: '',
        price: 0,
        category: '',
        image: '',
        sizes: '',
        colors: '',
        stock: 10
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    // Map frontend 'image' to backend 'image_url' expectation if needed
    const payload = {
      ...currentProduct,
      image_url: currentProduct.image // Backend expects image_url
    };

    try {
      if (isEditing && currentProduct.id) {
        await api.updateProduct(currentProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }
      await loadProducts();
      setIsModalOpen(false);
    } catch (error) {
      alert('Erro ao salvar produto');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-rosy-black text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white">Gestão de Produtos</h1>
            <p className="text-gray-400">Gerencie o catálogo da Rosy Modas</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setViewState(ViewState.HOME)}
              className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors"
            >
              Ver Loja
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('rosy_token');
                setViewState(ViewState.LOGIN);
              }}
              className="px-4 py-2 bg-red-900/50 text-red-200 rounded hover:bg-red-900 transition-colors"
            >
              Sair
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-rosy-red text-white rounded font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Novo Produto
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-rosy-dark/30 border border-rosy-dark rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-rosy-red"
          />
        </div>

        {/* Table */}
        <div className="bg-rosy-dark/30 rounded-lg border border-rosy-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-rosy-dark border-b border-gray-700 text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Preço</th>
                  <th className="px-6 py-3">Estoque</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando...</td></tr>
                ) : filteredProducts.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt="" className="h-10 w-10 rounded object-cover border border-gray-700" />
                          <div>
                            <div className="font-medium text-white">{product.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{product.category}</td>
                      <td className="px-6 py-4 font-medium text-rosy-red">R$ {product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{product.stock || 0} unid.</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenModal(product)} className="p-1 text-blue-400 hover:text-blue-300"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-rosy-dark border border-gray-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Produto</label>
                  <input
                    required
                    type="text"
                    value={currentProduct.name}
                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={currentProduct.price}
                    onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                  <input
                    required
                    type="text"
                    list="categories"
                    value={currentProduct.category}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                  <datalist id="categories">
                    <option value="Vestidos" />
                    <option value="Casacos" />
                    <option value="Acessórios" />
                    <option value="Sapatos" />
                  </datalist>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">URL da Imagem</label>
                  <div className="flex gap-2">
                     <input
                      required
                      type="text"
                      value={currentProduct.image}
                      onChange={e => setCurrentProduct({...currentProduct, image: e.target.value})}
                      className="flex-1 bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                      placeholder="https://..."
                    />
                    {currentProduct.image && (
                      <div className="w-10 h-10 rounded overflow-hidden border border-gray-600">
                        <img src={currentProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                  <textarea
                    required
                    rows={3}
                    value={currentProduct.description}
                    onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tamanhos (separados por vírgula)</label>
                  <input
                    type="text"
                    value={currentProduct.sizes || ''}
                    onChange={e => setCurrentProduct({...currentProduct, sizes: e.target.value})}
                    placeholder="P, M, G, GG"
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cores (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={currentProduct.colors || ''}
                    onChange={e => setCurrentProduct({...currentProduct, colors: e.target.value})}
                    placeholder="Vermelho, Preto"
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Quantidade em Estoque</label>
                  <input
                    type="number"
                    value={currentProduct.stock || 0}
                    onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-rosy-red outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-rosy-red text-white rounded font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {formLoading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
