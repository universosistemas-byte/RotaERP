import { Loader } from "@googlemaps/js-api-loader"

// REPLACE WITH YOUR API KEY
// Ideally this should be in .env, but for this generated code I'll put a placeholder here
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_API_KEY) {
    console.error("VITE_GOOGLE_MAPS_API_KEY missing in .env");
}

export const loader = new Loader({
    apiKey: GOOGLE_API_KEY,
    version: "weekly",
    libraries: ["places"] // Important!
});
