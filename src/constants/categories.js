import { ShoppingCart, Hammer, Car, ShoppingBag, Utensils, Pill, Dog } from 'lucide-react';

export const CATEGORIES = [
    { id: 'market_any', name: 'Mercados', icon: ShoppingCart, keyword: 'mercado supermercado mercearia atacadista' },
    { id: 'hardware_any', name: 'Mat. Construção', icon: Hammer, keyword: 'material de construção' },
    { id: 'auto_any', name: 'Auto Peças', icon: Car, keyword: 'auto peças' },
    { id: 'clothing_any', name: 'Roupas', icon: ShoppingBag, keyword: 'loja de roupas' },
    { id: 'pet_any', name: 'Pet Shop', icon: Dog, keyword: 'pet shop' },
    { id: 'food_any', name: 'Restaurantes', icon: Utensils, keyword: 'restaurante' },
    { id: 'pharmacy_any', name: 'Farmácias', icon: Pill, keyword: 'farmacia' },
];
