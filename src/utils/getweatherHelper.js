// Function to interpret Open-Meteo WMO weather codes
function getWeatherDescription(weatherCode) {
  switch (weatherCode) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
      return "Fog";
    case 48:
      return "Depositing rime fog";
    case 51:
      return "Light drizzle";
    case 53:
      return "Moderate drizzle";
    case 55:
      return "Dense drizzle";
    case 56:
      return "Light freezing drizzle";
    case 57:
      return "Dense freezing drizzle";
    case 61:
      return "Light rain";
    case 63:
      return "Moderate rain";
    case 65:
      return "Heavy rain";
    case 66:
      return "Light freezing rain";
    case 67:
      return "Heavy freezing rain";
    case 71:
      return "Light snow fall";
    case 73:
      return "Moderate snow fall";
    case 75:
      return "Heavy snow fall";
    case 77:
      return "Snow grains";
    case 80:
      return "Light rain showers";
    case 81:
      return "Moderate rain showers";
    case 82:
      return "Violent rain showers";
    case 85:
      return "Light snow showers";
    case 86:
      return "Heavy snow showers";
    case 95:
      return "Thunderstorm";
    case 96:
      return "Thunderstorm with slight hail";
    case 99:
      return "Thunderstorm with heavy hail";
    default:
      return "Unknown weather condition";
  }
}

/**
 * Fetches current weather and 48-hour forecast from Open-Meteo.
 * @param {number} latitude Latitude of the location.
 * @param {number} longitude Longitude of the location.
 * @returns {Promise<object|null>} A promise that resolves to a dictionary containing
 * current weather and hourly/daily forecast data, or null if an error occurs.
 */
export async function getWeatherData(latitude, longitude) {
  const baseUrl = "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: latitude?.toString(),
    longitude: longitude?.toString(),
    current_weather: "true",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,cloudcover",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
    forecast_days: "2", // Get today and tomorrow's forecast (approx. 48 hours)
    timezone: "auto", // Automatically detect timezone from coordinates
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching weather data: ${error}`);
    return null;
  }
}

/**
 * Processes raw Open-Meteo data into a concise, human-readable format for the LLM.
 * @param {object|null} weatherData The raw JSON response from Open-Meteo.
 * @param {string} userTimezone The user's specific timezone (e.g., 'Europe/Brussels').
 * @returns {object} A dictionary with 'current_weather_summary' and 'forecast_summary'.
 */
export function processWeatherForLLM(weatherData, userTimezone) {
  const now = new Date();
  // Get the current time in the specified timezone
  const nowInUserTimezone = new Date(
    now.toLocaleString("en-US", { timeZone: userTimezone })
  );

  // --- Current Weather ---
  const current = weatherData.current_weather || {};
  const currentTemp = current.temperature;
  const currentWeatherCode = current.weathercode;
  const currentWindSpeed = current.windspeed;
  const currentWeatherDesc =
    currentWeatherCode !== undefined
      ? getWeatherDescription(currentWeatherCode)
      : "N/A";

  const currentSummary = `Currently: ${currentTemp}°C, ${currentWeatherDesc}. Wind: ${currentWindSpeed} km/h.`;

  // --- Hourly and Daily Forecast (for next 24-48 hours) ---
  const hourlyTimes = weatherData.hourly?.time || [];
  const hourlyTemps = weatherData.hourly?.temperature_2m || [];
  const hourlyApparentTemps = weatherData.hourly?.apparent_temperature || [];
  const hourlyWeatherCodes = weatherData.hourly?.weathercode || [];
  const hourlyPrecipitations = weatherData.hourly?.precipitation || [];

  // Find the current hour's index
  const currentHourStr = nowInUserTimezone.toISOString().slice(0, 13) + ":00"; // YYYY-MM-DDTHH:00
  let startIndex = hourlyTimes.indexOf(currentHourStr);
  if (startIndex === -1 && hourlyTimes.length > 0) {
    // If exact hour not found, find the first hour that is greater than or equal to now
    const nowMs = nowInUserTimezone.getTime();
    for (let i = 0; i < hourlyTimes.length; i++) {
      if (new Date(hourlyTimes[i]).getTime() >= nowMs) {
        startIndex = i;
        break;
      }
    }
    if (startIndex === -1) startIndex = 0; // Fallback
  } else if (startIndex === -1) {
    startIndex = 0; // No hourly data
  }

  const endIndex = Math.min(startIndex + 48, hourlyTimes.length);

  const forecastByDay = {};

  for (let i = startIndex; i < endIndex; i++) {
    const hourTimeStr = hourlyTimes[i];
    // Parse UTC time from API, then convert to user's local timezone
    const hourDt = new Date(
      new Date(hourTimeStr).toLocaleString("en-US", { timeZone: userTimezone })
    );
    const dayKey = hourDt.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!forecastByDay[dayKey]) {
      forecastByDay[dayKey] = {
        description_counts: {},
        max_temp: -Infinity,
        min_temp: Infinity,
        total_precipitation: 0.0,
      };
    }

    const temp = hourlyTemps[i];
    const apparentTemp = hourlyApparentTemps[i]; // Not used in summary, but available
    const weatherCode = hourlyWeatherCodes[i];
    const precipitation = hourlyPrecipitations[i];

    const desc = getWeatherDescription(weatherCode);
    forecastByDay[dayKey].description_counts[desc] =
      (forecastByDay[dayKey].description_counts[desc] || 0) + 1;
    forecastByDay[dayKey].max_temp = Math.max(
      forecastByDay[dayKey].max_temp,
      temp
    );
    forecastByDay[dayKey].min_temp = Math.min(
      forecastByDay[dayKey].min_temp,
      temp
    );
    forecastByDay[dayKey].total_precipitation += precipitation;
  }

  const forecastSummary = [];
  const sortedDayKeys = Object.keys(forecastByDay).sort();

  for (const dayKey of sortedDayKeys) {
    const dayInfo = forecastByDay[dayKey];
    const dateObj = new Date(dayKey);
    const today = new Date(nowInUserTimezone.toISOString().slice(0, 10)); // Current date without time
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let dayName;
    if (
      dateObj.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
    ) {
      dayName = "Today";
    } else if (
      dateObj.toISOString().slice(0, 10) === tomorrow.toISOString().slice(0, 10)
    ) {
      dayName = "Tomorrow";
    } else {
      dayName = new Date(dayKey + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
      });
    }

    // Get most common weather description for the day
    let mostCommonDesc = "N/A";
    let maxCount = 0;
    for (const desc in dayInfo.description_counts) {
      if (dayInfo.description_counts[desc] > maxCount) {
        maxCount = dayInfo.description_counts[desc];
        mostCommonDesc = desc;
      }
    }

    const maxT = Math.round(dayInfo.max_temp);
    const minT = Math.round(dayInfo.min_temp);
    const precip = Math.round(dayInfo.total_precipitation * 10) / 10; // Round to 1 decimal place

    forecastSummary.push(
      `${dayName}: ${mostCommonDesc}, ${minT}°C to ${maxT}°C. Precipitation: ${precip} mm.`
    );
  }

  return {
    current_time: nowInUserTimezone,
    current_weather_summary: currentSummary,
    forecast_summary: forecastSummary.join(" "),
  };
}
