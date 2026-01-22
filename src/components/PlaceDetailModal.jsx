import React from 'react';
import { X, MapPin, Navigation } from 'lucide-react';

export default function PlaceDetailModal({ place, onClose }) {
    if (!place) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 m-4">
            <div className="glass-panel rounded-2xl p-6 mx-auto max-w-lg relative animate-slide-up bg-white/95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                <h3 className="text-xl font-bold text-slate-800 pr-8 mb-1">
                    {place.name}
                </h3>

                <div className="flex items-start gap-2 text-slate-600 mb-6 bg-slate-50 p-2 rounded-lg">
                    <MapPin size={16} className="mt-1 flex-shrink-0 text-indigo-500" />
                    <span className="text-sm">{place.vicinity}</span>
                </div>

                <div className="flex justify-end">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}&destination_place_id=${place.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Navigation size={16} />
                        Ir para o local
                    </a>
                </div>
            </div>

            <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
        </div>
    );
}
