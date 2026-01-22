import React, { useState } from 'react';
import { Map as MapIcon, LayoutGrid, Search, ChevronRight, MapPin } from 'lucide-react';
import MapContainer from './components/MapContainer';
import CategoryBar from './components/CategoryBar';
import PlaceDetailModal from './components/PlaceDetailModal';
import PlaceCard from './components/PlaceCard';
import CityAutocomplete from './components/CityAutocomplete';
import GroupDetailModal from './components/GroupDetailModal';

export default function App() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null); // New State for Group Modal
    const [places, setPlaces] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [serviceAPI, setServiceAPI] = useState(null); // { getDetails: (id) => Promise }

    // Visit Tracking State (Persistent)
    const [visits, setVisits] = useState(() => {
        const saved = localStorage.getItem('rotaerp_visits');
        return saved ? JSON.parse(saved) : {};
    });

    const handleUpdateVisit = (placeId, data) => {
        const newVisits = {
            ...visits,
            [placeId]: { ...visits[placeId], ...data, lastUpdated: new Date().toISOString() }
        };
        setVisits(newVisits);
        localStorage.setItem('rotaerp_visits', JSON.stringify(newVisits));
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [neighborhood, setNeighborhood] = useState(''); // New: Neighborhood/Route Context
    const [city, setCity] = useState('Sinop - MT'); // Default City

    const handleSelectCategory = (category) => {
        // Clear KEYWORD search when selecting a category, but KEEP neighborhood
        setSearchTerm('');
        setInputValue('');

        if (selectedCategory?.id === category.id) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(category);
        }
        setSelectedPlace(null);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            setSearchTerm(inputValue);
            setSelectedCategory(null); // Clear category when searching
            setSelectedPlace(null);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100 flex flex-col">

            {/* HEADER */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-4 py-3 flex items-center justify-between z-40 shadow-sm shrink-0 sticky top-0 gap-4">
                {/* Logo/Brand Icon (Optional, kept minimal) */}
                <div className="hidden md:flex bg-slate-100 p-2 rounded-full shrink-0">
                    <div className="bg-indigo-600 w-3 h-3 rounded-full"></div>
                </div>

                {/* SEARCH INPUTS CONTAINER */}
                <div className="flex-1 max-w-4xl mx-auto flex gap-2">
                    {/* City Input (Autocomplete) */}
                    <CityAutocomplete
                        value={city}
                        onChange={setCity}
                    />
                    {/* Main Search (Keywords) */}
                    <div className="relative group flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="O que procura?"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 border-none rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* Neighborhood/Route Input */}
                    <div className="relative group w-1/3 min-w-[150px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapIcon size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Bairro ou Rota..."
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 border-none rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* View Toggle (Right) */}
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <MapIcon size={20} />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
                {/* FILTERS (Floating below Header) */}
                <div className="absolute top-0 left-0 right-0 z-30 pt-4 pb-2 px-2 pointer-events-none">
                    {/* Inner container with pointer-events-auto so clicks work */}
                    <div className="pointer-events-auto">
                        <CategoryBar
                            selectedCategory={selectedCategory}
                            onSelectCategory={handleSelectCategory}
                        />
                    </div>
                </div>

                {/* LIST VIEW (DASHBOARD) */}
                {viewMode === 'list' && (
                    <div className="absolute inset-0 z-10 overflow-y-auto pt-20 pb-20 px-4">
                        {places.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p>Selecione uma categoria ou pesquise para começar.</p>
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto pb-10 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                                {/* Render SUMMARY CARDS for each Neighborhood Group */}
                                {places.map((group, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedGroup(group)}
                                        className="w-full bg-slate-200 hover:bg-slate-300 active:scale-[0.98] transition-all rounded-xl p-4 flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-md h-full"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="bg-white/80 p-2 rounded-lg text-slate-600 shrink-0">
                                                <MapIcon size={20} />
                                            </div>
                                            <div className="text-left shrink min-w-0">
                                                <h3 className="font-bold text-slate-700 text-lg capitalize truncate">
                                                    {group.title}
                                                </h3>
                                                <span className="text-xs text-slate-500 font-medium block">
                                                    {group.places.length} locais
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-slate-400 group-hover:text-slate-600 shrink-0 ml-2" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MAP VIEW (Always Rendered but hidden if in list mode) */}
                <div className={`absolute inset-0 z-0 ${viewMode === 'list' ? 'invisible' : 'visible'}`}>
                    <MapContainer
                        viewMode={viewMode}
                        category={selectedCategory}
                        searchTerm={searchTerm}
                        neighborhood={neighborhood}
                        city={city}
                        onSelectPlace={(p) => {
                            setSelectedPlace(p);
                            if (viewMode === 'list') setViewMode('map'); // Switch to map if clicking place logic updates
                        }}
                        onPlacesFetched={setPlaces}
                        onServiceReady={setServiceAPI}
                    />
                </div>

                {/* DETAILS MODAL (Only for Map View mostly) */}
                {viewMode === 'map' && selectedPlace && (
                    <PlaceDetailModal
                        place={selectedPlace}
                        onClose={() => setSelectedPlace(null)}
                    />
                )}

                {/* GROUP/NEIGHBORHOOD MODAL (For List View) */}
                {selectedGroup && (
                    <GroupDetailModal
                        group={selectedGroup}
                        visits={visits}
                        onUpdateVisit={handleUpdateVisit}
                        onClose={() => setSelectedGroup(null)}
                        onFetchDetails={serviceAPI?.getDetails}
                    />
                )}
            </div>
        </div>
    );
}
