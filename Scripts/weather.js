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
export async function initWeather(location) {
    try {
        let locationName = location || null;
        let coords = null;

        // 1) If user defined a city manually → forward geocoding
        if (locationName) {
            coords = await getCoordinates(locationName);
        }

        // 2) If no coords yet → try browser GPS
        if (!coords) {
            coords = await getDeviceCoords();

            // If GPS worked → resolve city from coordinates
            if (coords) {
                locationName = await getCityFromCoords(coords.lat, coords.lon);
            }
        }

        // 3) Final fallback → Mexico City
        if (!coords) {
            locationName = "Mexico City";
            coords = await getCoordinates(locationName);
        }

        if (!coords) {
            console.warn("Could not resolve coordinates at all.");
            return locationName || "Mexico City";
        }

        // 4) Fetch weather
        const condition = await getWeather(coords.lat, coords.lon);

        updateWeatherIcon(condition);
        setWeatherCondition(condition);
        loadSuggestedTasks();

        console.log("Weather loaded for:", locationName, "→", condition);

        return locationName || "Mexico City";

    } catch (err) {
        console.error("Weather error:", err);
        return location || "Mexico City";
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
// WEATHER CONDITION (Open-Meteo)
// ---------------------------------------------------------
async function getWeather(lat, lon) {
    const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    const data = await res.json();
    const code = data?.current_weather?.weathercode ?? 0;

    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rainy";
    if ([2, 3].includes(code)) return "cloudy";
    return "sunny";
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
