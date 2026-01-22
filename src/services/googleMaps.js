import { Loader } from "@googlemaps/js-api-loader"

// REPLACE WITH YOUR API KEY
// Ideally this should be in .env, but for this generated code I'll put a placeholder here
export const GOOGLE_API_KEY = "AIzaSyBc3tBkqzUmnyPNxpxdP5KkIKYKEdApUeo";

export const loader = new Loader({
    apiKey: GOOGLE_API_KEY,
    version: "weekly",
    libraries: ["places"] // Important!
});
