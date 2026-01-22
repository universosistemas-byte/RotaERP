import React from 'react';
import { CATEGORIES } from '../constants/categories';

export default function CategoryBar({ selectedCategory, onSelectCategory }) {
    return (
        <div className="w-full overflow-x-auto px-4 py-2 no-scrollbar">
            <div className="flex gap-3 px-2 w-max mx-auto">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory?.id === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat)}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-md whitespace-nowrap
                ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                                    : 'glass-panel text-slate-700 hover:bg-white'}
              `}
                        >
                            <Icon size={16} />
                            {cat.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Add this to index.css later if needed for hiding scrollbar
const style = document.createElement('style');
style.textContent = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);
