import React from 'react';
import { X, MapPin } from 'lucide-react';
import PlaceCard from './PlaceCard';

export default function GroupDetailModal({ group, onClose, onFetchDetails, visits, onUpdateVisit }) {
    if (!group) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            {/* Modal Panel */}
            <div className="bg-slate-100 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">

                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center capitalize">
                            <MapPin className="mr-2 text-indigo-600" />
                            {group.title}
                        </h2>
                        <p className="text-slate-500 text-sm ml-8">
                            {group.places.length} locais encontrados
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {group.places.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.places.map((place) => (
                                <PlaceCard
                                    key={place.place_id}
                                    place={place}
                                    visitData={visits[place.place_id]}
                                    onUpdateVisit={onUpdateVisit}
                                    onFetchDetails={onFetchDetails}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p>Nenhum local encontrado nesta área.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-scale-up { animation: scale-up 0.2s ease-out; }
            `}</style>
        </div>
    );
}
