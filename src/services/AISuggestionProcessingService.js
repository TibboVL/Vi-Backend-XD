import db from "../db/index.js";
import {
  getWeatherData,
  processWeatherForLLM,
} from "../utils/getweatherHelper.js";

export async function getAISuggestedActivities(request, lon, lat) {
  console.info(
    `ℹ️  Getting personalized suggestions for user: ${request.user.email}`
  );

  // 1) get user information
  await gatherInformationForPrompt(request, lon, lat);
}

async function gatherInformationForPrompt(request, lon, lat) {
  // weather & timezone
  const rawWeatherData = await getWeatherData(lat, lon);

  if (rawWeatherData) {
    // Open-Meteo's API response directly provides the detected timezone.
    // It's best to use this for processing, as it's the most accurate for the lat/lon.
    const userTimezone = rawWeatherData.timezone;

    const weatherForLLM = processWeatherForLLM(rawWeatherData, userTimezone);
    console.log("--- Weather for LLM Input ---");
    console.log(`Current Weather: ${weatherForLLM.current_weather_summary}`);
    console.log(`Next 24-48h Forecast: ${weatherForLLM.forecast_summary}`);
  } else {
    console.log("Could not retrieve weather data.");
  }
  // energy level & mood
  const checkins = await db("checkin as c")
    .where("c.userId", request.user.userId)
    .orderBy("c.timestamp")
    .select("*");
  console.log(checkins);
}
