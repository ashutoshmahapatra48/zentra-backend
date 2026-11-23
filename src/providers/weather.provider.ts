import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

const weatherClient = axios.create({ timeout: 8_000 });
const geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";

const weatherDescriptions: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Rain showers",
  81: "Moderate rain showers", 82: "Violent rain showers", 95: "Thunderstorm",
  96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
};

/** Resolves a place name and retrieves its current conditions from Open-Meteo. */
export async function getCurrentWeather(location: string, temperatureUnit: "celsius" | "fahrenheit") {
  try {
    const geocoding = await weatherClient.get<{
      results?: { name: string; country?: string; latitude: number; longitude: number; timezone?: string }[];
    }>(geocodingUrl, { params: { name: location, count: 1, language: "en", format: "json" } });
    const place = geocoding.data.results?.[0];
    if (!place) throw new ApiError(404, `Could not find a location matching "${location}"`);

    const weather = await weatherClient.get<{
      current?: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        precipitation: number;
        weather_code: number;
        wind_speed_10m: number;
      };
      current_units?: { temperature_2m?: string; wind_speed_10m?: string };
    }>(forecastUrl, {
      params: {
        latitude: place.latitude,
        longitude: place.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        temperature_unit: temperatureUnit,
        timezone: place.timezone || "auto",
      },
    });
    const current = weather.data.current;
    if (!current) throw new ApiError(502, "Weather provider returned no current conditions");

    return {
      location: [place.name, place.country].filter(Boolean).join(", "),
      time: current.time,
      condition: weatherDescriptions[current.weather_code] || "Unknown conditions",
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed: current.wind_speed_10m,
      units: weather.data.current_units,
      source: "Open-Meteo",
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Weather provider request failed:", error);
    throw new ApiError(502, "Weather information is temporarily unavailable");
  }
}
