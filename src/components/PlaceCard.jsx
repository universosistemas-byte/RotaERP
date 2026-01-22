import React, { useState } from 'react';
import { MapPin, Phone, Globe, Star, ExternalLink, ChevronDown, Check } from 'lucide-react';

export default function PlaceCard({ place, onFetchDetails, visitData, onUpdateVisit }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // To show visit controls

    const handleFetchDetails = async () => {
        if (details) return; // Already fetched
        setLoading(true);
        try {
            const data = await onFetchDetails(place.place_id);
            setDetails(data);
        } catch (error) {
            console.error("Error fetching details", error);
        } finally {
            setLoading(false);
        }
    };

    const rating = place.rating || "N/A";
    const isVisited = visitData?.visited || false;
    const note = visitData?.note || "";

    const toggleVisited = () => {
        if (onUpdateVisit) {
            onUpdateVisit(place.place_id, { visited: !isVisited });
        }
    };

    const saveNote = (newNote) => {
        if (onUpdateVisit) {
            onUpdateVisit(place.place_id, { note: newNote });
        }
    };

    return (
        <div className={`
            bg-white rounded-xl shadow-sm border transition-all flex flex-col h-full
            ${isVisited ? 'border-green-400 ring-1 ring-green-100' : 'border-slate-200 hover:shadow-md'}
        `}>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg line-clamp-2 leading-tight">
                        {place.name}
                    </h3>
                    {isVisited && (
                        <div className="bg-green-100 text-green-700 p-1 rounded-full shrink-0 animate-bounce-short">
                            <Check size={16} />
                        </div>
                    )}
                </div>

                {place.rating && !isVisited && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star size={12} className="fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-slate-600 font-semibold">{place.rating}</span>
                    </div>
                )}

                <div className="flex items-start gap-2 text-slate-500 text-sm mb-3 flex-grow">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{place.vicinity || place.formatted_address}</span>
                </div>

                <div className="space-y-3 mt-auto pt-3 border-t border-slate-100">
                    {/* Contact Info Section */}
                    {!details ? (
                        <button
                            onClick={handleFetchDetails}
                            disabled={loading}
                            className="w-full py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Buscando...' : 'Ver Contatos'}
                            <ChevronDown size={14} />
                        </button>
                    ) : (
                        <div className="space-y-2 animate-feed-in">
                            {details.formatted_phone_number ? (
                                <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded">
                                    <Phone size={14} className="text-green-600" />
                                    <span className="font-mono">{details.formatted_phone_number}</span>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic px-2">Sem telefone</div>
                            )}

                            {details.website ? (
                                <a
                                    href={details.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 p-2 rounded"
                                >
                                    <Globe size={14} />
                                    <span className="truncate max-w-[200px]">{new URL(details.website).hostname}</span>
                                    <ExternalLink size={10} className="ml-auto" />
                                </a>
                            ) : (
                                <div className="text-xs text-slate-400 italic px-2">Sem site</div>
                            )}
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex gap-2 mt-2">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination_place_id=${place.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 text-center text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            Abrir Maps
                        </a>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex-1 py-1.5 text-center text-xs font-medium rounded-lg transition-colors ${isExpanded || isVisited ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {isVisited ? 'Gerenciar' : 'Registrar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* EXPANDED SECTION: VISIT CONTROL */}
            {(isExpanded || (isVisited && note)) && (
                <div className="bg-slate-50 p-4 border-t border-slate-200 rounded-b-xl animate-fade-in text-sm">
                    <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isVisited}
                                onChange={toggleVisited}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Visitado
                        </label>
                        {isVisited && <span className="text-xs text-green-600 font-bold">Concluído</span>}
                    </div>

                    <textarea
                        placeholder="Motivo de não fechamento / Obs..."
                        value={note}
                        onChange={(e) => saveNote(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-20 bg-white"
                    />
                </div>
            )}
        </div>
    );
}
