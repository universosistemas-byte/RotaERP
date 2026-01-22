import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loader } from '../services/googleMaps';

export default function CityAutocomplete({ value, onChange }) {
    const inputRef = useRef(null);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    useEffect(() => {
        let autocomplete = null;

        loader.load().then((google) => {
            setScriptsLoaded(true);

            if (!inputRef.current) return;

            // Configure Autocomplete to search for CITIES (municipalities) in Brazil
            const options = {
                types: ['(cities)'],
                componentRestrictions: { country: 'br' },
                fields: ['formatted_address', 'name', 'geometry']
            };

            autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                // If user selected a suggestion
                if (place.geometry && place.name) {
                    // Prefer "City - State" format if possible, or just formatted_address
                    // Usually formatted_address is "Sinop, State of Mato Grosso, Brazil" or "Sinop - MT, Brazil"
                    // Let's rely on what Google gives, or just pass the text.
                    // But importantly, we want to notify parent.

                    // Let's construct a nice short string: "Sinop - MT"
                    let cityName = place.name;
                    let stateCode = "";

                    // Extract state code (Admin Area Level 1)
                    const stateComponent = place.address_components?.find(c => c.types.includes('administrative_area_level_1'));
                    if (stateComponent) stateCode = stateComponent.short_name;

                    const finalString = stateCode ? `${cityName} - ${stateCode}` : place.formatted_address;

                    onChange(finalString);
                } else {
                    // User just hit enter without selecting, or typed something custom
                    // We keep what was typed
                    onChange(inputRef.current.value);
                }
            });
        });

        // Cleanup (remove DOM listeners effectively handled by Maps API, but good practice to clear ref if needed)
        // Autocomplete instance doesn't have a simple 'destroy' method in v3, but clearing listeners helps.
        return () => {
            if (autocomplete) {
                google.maps.event.clearInstanceListeners(autocomplete);
            }
        };
    }, [onChange]); // Run once mostly

    return (
        <div className="relative group w-1/4 min-w-[120px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <MapPin size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
                ref={inputRef}
                type="text"
                placeholder="Cidade..."
                // We don't control 'value' fully via React state to avoid conflict with Google's typing handling
                // But we need to set initial value.
                defaultValue={value}
                // Updating local state only on blur or explicit change if we wanted controlled, 
                // but for Autocomplete, uncontrolled with ref + callback is often smoother.
                // However, to sync with parent 'city' state:
                onChange={(e) => onChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 border-none rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-inner font-medium truncate"
            />
        </div>
    );
}
