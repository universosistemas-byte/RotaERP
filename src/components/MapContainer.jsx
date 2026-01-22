import React, { useEffect, useRef, useState } from 'react';
import { loader } from '../services/googleMaps';
import { CATEGORIES } from '../constants/categories';

export default function MapContainer({ category, searchTerm, neighborhood, city, onSelectPlace, onPlacesFetched, onServiceReady, viewMode }) {
    const mapRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [placesService, setPlacesService] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [geocoder, setGeocoder] = useState(null);

    // 1. Initialize Map
    useEffect(() => {
        loader.load().then((google) => {
            // Default to Sinop - MT if geolocation fails
            const initialPos = { lat: -11.8626, lng: -55.5165 };

            const map = new google.maps.Map(mapRef.current, {
                center: initialPos,
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                ]
            });

            const service = new google.maps.places.PlacesService(map);
            const geo = new google.maps.Geocoder();

            setMapInstance(map);
            setPlacesService(service);
            setGeocoder(geo);

            // Expose fetch details capability to parent
            if (onServiceReady) {
                onServiceReady({
                    getDetails: (placeId) => {
                        return new Promise((resolve, reject) => {
                            service.getDetails({
                                placeId: placeId,
                                fields: ['name', 'rating', 'formatted_phone_number', 'website']
                            }, (place, status) => {
                                if (status === google.maps.places.PlacesServiceStatus.OK) {
                                    resolve(place);
                                } else {
                                    reject(status);
                                }
                            });
                        });
                    }
                });
            }

            // Get User Location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        map.setCenter(pos);
                        setUserLocation(pos);

                        new google.maps.Marker({
                            position: pos,
                            map: map,
                            icon: {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: "#4f46e5",
                                fillOpacity: 1,
                                strokeColor: "white",
                                strokeWeight: 2,
                            },
                            title: "Você está aqui"
                        });
                    },
                    (error) => {
                        console.warn("Geolocation permission denied or failed. Using default (Sinop).", error);
                        setUserLocation(initialPos);
                    }
                );
            } else {
                setUserLocation(initialPos);
            }
        });
    }, [onServiceReady]);

    // 2. Handle City Change (Geocoding) - MOVES MAP TO CITY
    useEffect(() => {
        if (!geocoder || !mapInstance || !city) return;

        const timeoutId = setTimeout(() => {
            geocoder.geocode({ address: city }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    mapInstance.panTo(location);
                    mapInstance.setZoom(13);
                    // Update userLocation to this city center so nearby searches prioritize it
                    setUserLocation(location);
                } else {
                    console.warn("Geocode was not successful for the following reason: " + status);
                }
            });
        }, 800);

        return () => clearTimeout(timeoutId);

    }, [city, geocoder, mapInstance]);

    // 3. Search Logic
    useEffect(() => {
        if (!mapInstance || !placesService || !userLocation) return;

        // Clear markers initially
        markers.forEach(m => m.setMap(null));
        setMarkers([]);

        // Helper to fetch ALL pages for Text Search (Corrected Promise Logic)
        const fetchAllTextPages = (query) => {
            return new Promise((resolve) => {
                const request = {
                    location: userLocation,
                    radius: 30000,
                    query: query,
                };

                let allResults = [];

                const callback = (results, status, pagination) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        allResults.push(...results);
                    }

                    if (pagination && pagination.hasNextPage) {
                        setTimeout(() => {
                            pagination.nextPage();
                        }, 2000);
                    } else {
                        resolve(allResults);
                    }
                };

                placesService.textSearch(request, callback);
            });
        };

        // Helper to fetch ALL pages for Nearby Search (Corrected Promise Logic)
        const fetchAllNearbyPages = (location, keyword, radius = 5000) => {
            return new Promise((resolve) => {
                const request = {
                    location: location,
                    radius: radius,
                    keyword: keyword,
                };

                let allResults = [];

                const callback = (results, status, pagination) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        allResults.push(...results);
                    }

                    if (pagination && pagination.hasNextPage) {
                        setTimeout(() => {
                            pagination.nextPage();
                        }, 2000);
                    } else {
                        resolve(allResults);
                    }
                };

                placesService.nearbySearch(request, callback);
            });
        };

        // NEW: Fetch using OR logic (splits "mercado padaria" into separate searches)
        const fetchNearbyByKeywordsOR = async (location, keywordsString, radius = 7000) => {
            const keywords = keywordsString
                .split(/\s+/)
                .map(s => s.trim())
                .filter(Boolean);

            // Limit terms to avoid too many API calls
            const uniqueTerms = Array.from(new Set(keywords)).slice(0, 6);

            const pages = await Promise.all(
                uniqueTerms.map(term => fetchAllNearbyPages(location, term, radius))
            );

            const flat = pages.flat();
            const m = new Map();
            flat.forEach(p => m.set(p.place_id, p));
            return [...m.values()];
        };

        // NEW: Get 3x3 Grid Points from Bounds
        const getGridPointsFromBounds = (bounds) => {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            const lats = [sw.lat(), (sw.lat() + ne.lat()) / 2, ne.lat()];
            const lngs = [sw.lng(), (sw.lng() + ne.lng()) / 2, ne.lng()];

            const points = [];
            for (const lat of lats) {
                for (const lng of lngs) {
                    points.push(new google.maps.LatLng(lat, lng));
                }
            }
            return points;
        };

        // NEW: Fetch using Grid + OR logic (Best for City-wide Category Search)
        const fetchCityByGridOR = async (keywords) => {
            const bounds = mapInstance.getBounds();
            if (!bounds) return [];

            const points = getGridPointsFromBounds(bounds);
            const radius = 6000; // 6km radius per grid point

            const batches = await Promise.all(
                points.map(pt => fetchNearbyByKeywordsOR(pt, keywords, radius))
            );

            const flat = batches.flat();
            const m = new Map();
            flat.forEach(p => m.set(p.place_id, p));
            return [...m.values()];
        };

        const executeSearch = async () => {
            let allResults = [];
            let groupedResults = [];

            const neighborhoods = neighborhood
                ? neighborhood.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            if (!searchTerm && !category) {
                if (onPlacesFetched) onPlacesFetched([]);
                return;
            }

            let baseKeyword = searchTerm || (category ? category.keyword : "");

            // CASE 2: Search with Explicit Neighborhoods (Strategy: Geo + Nearby OR-Logic)
            if (neighborhoods.length > 0) {
                const promises = neighborhoods.map(async (bairro) => {
                    // Step 1: Geocode the Neighborhood Center
                    const addressToGeocode = `${bairro}, ${city}`;
                    return new Promise((resolve) => {
                        geocoder.geocode({ address: addressToGeocode }, async (geoResults, status) => {
                            if (status === 'OK' && geoResults[0]) {
                                const location = geoResults[0].geometry.location;
                                // Step 2: Nearby Search with OR LOGIC
                                const results = await fetchNearbyByKeywordsOR(location, baseKeyword, 5000);
                                resolve({
                                    title: bairro,
                                    places: results
                                });
                            } else {
                                console.warn(`Geocode failed for ${addressToGeocode}:`, status);
                                // Fallback to text search if geo fails
                                const query = `${baseKeyword} em ${bairro}, ${city}`;
                                const results = await fetchAllTextPages(query);
                                resolve({
                                    title: bairro,
                                    places: results
                                });
                            }
                        });
                    });
                });

                groupedResults = await Promise.all(promises);
                allResults = groupedResults.flatMap(g => g.places);

            } else {
                // CASE 3: Standard Search (Whole City)

                // Strategy A: Grid Search (Best for Categories like "Mercados", "Oficinas")
                if (category) {
                    // Use the 3x3 Grid Search with OR logic
                    allResults = await fetchCityByGridOR(baseKeyword);
                } else {
                    // Strategy B: Text Search (Best for specific names like "Mercado do João")
                    // Use textSearch with City enforcement
                    const query = city ? `${baseKeyword} em ${city}` : baseKeyword;
                    allResults = await fetchAllTextPages(query);
                }

                const groups = {};
                allResults.forEach(place => {
                    let neighborhoodName = "Outros";
                    if (place.vicinity) {
                        const parts = place.vicinity.split('-');
                        if (parts.length > 1) {
                            let candidate = parts[parts.length - 1].trim();
                            if (candidate.includes(',')) candidate = candidate.split(',')[0].trim();
                            if (candidate.length > 2) neighborhoodName = candidate;
                        }
                    }
                    if (neighborhoodName === "Outros" && place.formatted_address) {
                        try {
                            const sections = place.formatted_address.split(' - ');
                            if (sections.length >= 2) {
                                let candidateSection = sections[1];
                                if (candidateSection.includes(',')) candidateSection = candidateSection.split(',')[0].trim();
                                if (candidateSection.length > 2) neighborhoodName = candidateSection;
                            }
                        } catch (e) { }
                    }
                    if (!groups[neighborhoodName]) groups[neighborhoodName] = [];
                    groups[neighborhoodName].push(place);
                });

                groupedResults = Object.keys(groups).sort().map(name => ({
                    title: name,
                    places: groups[name]
                }));
                if (groupedResults.length === 1 && groupedResults[0].title === "Outros") {
                    groupedResults[0].title = "Resultados Encontrados";
                }
            }

            // DEDUPLICATION
            const uniquePlaces = new Map();
            allResults.forEach(p => {
                if (!uniquePlaces.has(p.place_id)) uniquePlaces.set(p.place_id, p);
            });
            const dedupedResults = Array.from(uniquePlaces.values());

            if (onPlacesFetched) onPlacesFetched(groupedResults);

            const newMarkers = dedupedResults.map((place) => {
                const marker = new google.maps.Marker({
                    map: mapInstance,
                    position: place.geometry.location,
                    title: place.name,
                    animation: google.maps.Animation.DROP,
                    icon: {
                        path: "M10.453 14.016l-5.859-5.859c-0.891-0.891-0.891-2.344 0-3.234l5.859-5.859c0.891-0.891 2.344-0.891 3.234 0l5.859 5.859c0.891 0.891 0.891 2.344 0 3.234l-5.859 5.859c-0.891 0.891-2.344 0.891-3.234 0z",
                        fillColor: "#ef4444",
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#ffffff",
                        scale: 1.2,
                        anchor: new google.maps.Point(12, 12),
                        labelOrigin: new google.maps.Point(12, 26)
                    },
                    label: {
                        text: place.name,
                        color: "#1e293b",
                        fontSize: "13px",
                        fontWeight: "600",
                        className: "marker-label"
                    }
                });

                marker.addListener("click", () => {
                    onSelectPlace(place);
                    mapInstance.panTo(place.geometry.location);
                });

                return marker;
            });

            setMarkers(newMarkers);
        };

        executeSearch();

    }, [category, searchTerm, neighborhood, city, mapInstance, placesService, userLocation, geocoder]);

    return (
        <div ref={mapRef} className="w-full h-full" />
    );
}
