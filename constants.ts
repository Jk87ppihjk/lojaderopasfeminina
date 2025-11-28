import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Vestido Gala Vermelho",
    price: 299.90,
    category: "Vestidos",
    image: "https://picsum.photos/400/600?random=1",
    description: "Um vestido longo deslumbrante em tom vermelho sangue, perfeito para ocasiões noturnas."
  },
  {
    id: 2,
    name: "Blazer Preto Executiva",
    price: 189.90,
    category: "Casacos",
    image: "https://picsum.photos/400/600?random=2",
    description: "Corte moderno e tecido premium. A peça chave para um look de trabalho poderoso."
  },
  {
    id: 3,
    name: "Saia Midi Couro",
    price: 129.90,
    category: "Saias",
    image: "https://picsum.photos/400/600?random=3",
    description: "Saia em couro ecológico preto com fenda lateral. Ousada e elegante."
  },
  {
    id: 4,
    name: "Blusa Seda Carmim",
    price: 89.90,
    category: "Blusas",
    image: "https://picsum.photos/400/600?random=4",
    description: "Toque suave e caimento leve. Ideal para combinar com peças escuras."
  },
  {
    id: 5,
    name: "Calça Alfaiataria Dark",
    price: 159.90,
    category: "Calças",
    image: "https://picsum.photos/400/600?random=5",
    description: "Conforto e sofisticação em uma peça única. Cintura alta."
  },
  {
    id: 6,
    name: "Jaqueta Bomber Rosy",
    price: 210.00,
    category: "Casacos",
    image: "https://picsum.photos/400/600?random=6",
    description: "Estilo urbano com detalhes em vermelho vibrante."
  }
];

export const SYSTEM_INSTRUCTION = `
Você é a 'Rosy', a consultora de moda virtual e assistente pessoal da loja 'Rosy Modas'.
O estilo da loja é focado em elegância, poder e sensualidade, com uma paleta de cores forte em Vermelho e Preto.
Seu tom de voz deve ser sofisticado, amigável e fashionista.
Você deve ajudar os clientes a escolher roupas baseadas no catálogo fornecido.
Se o cliente perguntar sobre preços, consulte o contexto fornecido.
Sugira combinações (looks) usando as peças disponíveis.
`;