// =========================================================
// WEATHER MANAGER — Open-Meteo + OpenStreetMap (reverse)
// =========================================================

import { loadSuggestedTasks } from "./suggestedTaskComponent.js";

let currentWeatherCondition = "sunny"; // default

export function setWeatherCondition(w) {
    currentWeatherCondition = w;
}

export function getCurrentWeatherCondition() {
    return currentWeatherCondition;
}

let weatherIcon = null;

// Capture weather icon once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    weatherIcon = document.querySelector(".icon-circle i");
});

// ---------------------------------------------------------
// MAIN ENTRY POINT
// ---------------------------------------------------------
export async function initWeather(savedLocation = null) {
    try {
        let locationName = savedLocation;
        let coords = null;

        // 1️⃣ User-defined location (highest priority)
        if (locationName) {
            console.log(locationName)
            coords = await getCoordinates(locationName).then(console.log("Coordinates found:", coords));

            // If user location exists but cannot be resolved,
            // still KEEP the name and do NOT fallback to GPS
            if (!coords) {
                console.warn("Could not resolve user location, keeping name:", locationName);
            }
        }

        // 2️⃣ Browser GPS (only if NO user location)
        if (!coords && !locationName) {
            coords = await getDeviceCoords();
            if (coords) {
                locationName = await getCityFromCoords(coords.lat, coords.lon);
            }
        }

        // 3️⃣ Final fallback → ONLY if no user location and no GPS
        if (!coords && !savedLocation) {
            locationName = "Mexico City";
            coords = await getCoordinates(locationName);
        }


        const condition = await getWeather(coords.lat, coords.lon);

        updateWeatherIcon(condition);
        setWeatherCondition(condition);
        loadSuggestedTasks();

        console.log("Weather loaded for:", locationName, "→", condition);
        return locationName;

    } catch (err) {
        console.error("Weather error:", err);
        return savedLocation || "Mexico City";
    }
}

// ---------------------------------------------------------
// FORWARD GEOCODING: city -> lat/lon (Open-Meteo)
// ---------------------------------------------------------
async function getCoordinates(city) {
    try {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );
        const data = await res.json();
        if (!data.results || !data.results.length) return null;

        return {
            lat: data.results[0].latitude,
            lon: data.results[0].longitude
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------
// REVERSE GEOCODING: lat/lon -> city (OpenStreetMap)
// ---------------------------------------------------------
async function getCityFromCoords(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );
        const data = await res.json();

        return (
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state ||
            null
        );
    } catch {
        return null;
    }
}

// ---------------------------------------------------------
// BROWSER GEOLOCATION → lat/lon
// ---------------------------------------------------------
function getDeviceCoords() {
    return new Promise(resolve => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            pos => resolve({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            }),
            () => resolve(null),
            { timeout: 3000 }
        );
    });
}

// ---------------------------------------------------------
// GET WEATHER CONDITION (via Express backend proxy)
// The weather data is fetched through a backend proxy endpoint.
// The browser only calls /api/weather; the 304 responses are due to HTTP caching.
// ---------------------------------------------------------
async function getWeather(lat, lon) {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    const data = await response.json();

    // Backend already normalizes the condition
    return data.condition || "sunny";
}

// ---------------------------------------------------------
// UPDATE WEATHER ICON
// ---------------------------------------------------------
function updateWeatherIcon(condition) {
    if (!weatherIcon) return;

    if (condition === "rainy") {
        weatherIcon.className = "bi bi-cloud-rain";
    } else if (condition === "cloudy") {
        weatherIcon.className = "bi bi-cloud";
    } else {
        weatherIcon.className = "bi bi-brightness-high";
    }
}
