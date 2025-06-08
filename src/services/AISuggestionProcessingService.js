import { getActivitiesCore } from "../controllers/api/v1/activity.controller.js";
import { lastValidCheckinHelper } from "../controllers/api/v1/checkin.controller.js";
import {
  getWeatherData,
  processWeatherForLLM,
} from "../utils/getweatherHelper.js";
import { GoogleGenAI, Type } from "@google/genai";
import { shuffle } from "../utils/shuffleHelper.js";
import { sendError, sendSuccess } from "../utils/responses.js";
import {
  GetActivitySuggestionsWithDetailsCore,
  insertSuggestedActivityItems,
} from "../controllers/api/v1/suggestedActivity.controller.js";
import {
  getAIRequestUsageForToday,
  insertAIRequestUsageEntry,
} from "../controllers/api/v1/aiRequestUsage.controller.js";
import { getUserActiveSubscription } from "../controllers/api/v1/subscription.controller.js";
import { getUTCDateOnly } from "../utils/dateHekoer.js";

export async function getAISuggestedActivities(request, res, lon, lat) {
  //! TODO add a check to see if user still has reccomendation tokens left in their subscription tier for today

  // 0) Check if user is allowed to request AI suggestions
  const ussageCountResult = await getAIRequestUsageForToday(request);
  const userActiveSubscriptionResult = await getUserActiveSubscription(request);
  if (ussageCountResult.error || userActiveSubscriptionResult.error) {
    return sendError(res, {
      statusCode: 400,
      message: `failed to check user subscription or request ussage! ${ussageCountResult.error?.message} ${userActiveSubscriptionResult.error?.message}`,
    });
  }

  console.log(ussageCountResult, userActiveSubscriptionResult);

  if (
    ussageCountResult.data.count >=
    userActiveSubscriptionResult.data.maxAIRequestsPerDay
  ) {
    const error = `❌ ${request.user.email} attempted to go over AI request budget for today - ${ussageCountResult.data.count} of ${userActiveSubscriptionResult.data.maxAIRequestsPerDay} allowed requests`;

    console.warn(error);
    return sendError(res, {
      statusCode: 503,
      message: error,
      meta: {
        resetAt: getUTCDateOnly(new Date(), 1),
      },
    });
  }

  console.info(
    `\nℹ️  Getting personalized suggestions for user: ${request.user.email} - ${ussageCountResult.data.count} of ${userActiveSubscriptionResult.data.maxAIRequestsPerDay} allowed requests`
  );

  // 1) get user information
  const userInfoResponse = await gatherInformationForPrompt(request, lon, lat);
  if (userInfoResponse.error) {
    return sendError(res, {
      statusCode: 500,
      message:
        "failed to gather user info, does this user have a checkin yet? are all parameters present? lon,lat?",
    });
  }
  const userInfo = userInfoResponse.data;

  // 2) get activities
  const energyLevelIndex = Object.entries(EnergyMappings).findIndex(
    (e) => e[1].max <= userInfo.checkin.energy
  );
  const energyLevelKeys = Object.keys(EnergyMappings);
  const energyLevelVariants = [
    energyLevelIndex > 0 ? energyLevelKeys[energyLevelIndex - 1] : null,
    energyLevelKeys[energyLevelIndex],
    energyLevelIndex < energyLevelKeys.length - 1
      ? energyLevelKeys[energyLevelIndex + 1]
      : null,
  ].filter(Boolean);
  const activityRequestParameters = {
    energyLevel: energyLevelVariants,
    distance: 20,
    lon: lon,
    lat: lat,
  };
  let activities = (
    await getActivitiesCore({
      ...request,
      query: activityRequestParameters,
    })
  ).data;
  shuffle(activities);

  const maxItemsOfSamePillar = 5;
  const limitByPillar = [];
  for (const activity of activities) {
    if (
      limitByPillar.filter(
        (a) => a.categories[0].pillar == activity.categories[0].pillar
      ).length < maxItemsOfSamePillar
    ) {
      limitByPillar.push(activity);
    }
  } // we should get at most maxItemsOfSamePillar * 4 activities now
  console.info(
    `ℹ️  Passing ${limitByPillar.length} activities out of ${activities.length} valid options to ai`
  );
  const promptInfo = {
    ...userInfo,
    activities: limitByPillar,
  };
  // 3) construct prompt
  const prompt = await constructReccomendationPrompt(promptInfo);
  console.log(prompt);
  console.log(`ℹ️  prompt is ${prompt.length} characters`);

  // 4) push prompt to ai
  let AIResponse = null;
  try {
    // 4.5) insert entry to keep track of user AI access counts
    const insertAIRequestUserEntryResult = await insertAIRequestUsageEntry(
      request
    );
    if (insertAIRequestUserEntryResult.error) {
      return sendError(res, {
        statusCode: 500,
        message: insertAIRequestUserEntryResult.error.message, //"Failed to update user request log!!",
      });
    }

    AIResponse = await handlePostAIApiCall(prompt);
  } catch (error) {
    console.warn(`❌ ERROR Gemini API request failed!: ${error}`);
    return sendError(res, {
      statusCode: error.code,
      message: error.message,
    });
  }

  console.info(
    `ℹ️  Gemini responded and used ${AIResponse.usageMetadata.totalTokenCount} tokens!`
  );

  /** @type {import("../types/types.js").AIActivityResponse[]} */
  const aiTextResponse = JSON.parse(AIResponse.text);
  console.log("response data", AIResponse);
  //console.log(aiTextResponse);

  // 5) store reccomendations in DB
  const suggestedActivityGroup = await insertSuggestedActivityItems(
    request,
    {
      checkinId: promptInfo.checkin.checkinId,
      amountConsideredActivities: limitByPillar.length,
      model: AIResponse.modelVersion,
    },
    aiTextResponse
  );
  if (suggestedActivityGroup.error) {
    return sendError(res, {
      statusCode: 500,
      message: `❌  Failed to save reccomendations to db, error: ${suggestedActivityGroup.error}`,
    });
  }

  // 6) return those reccomendations to use
  const activtySuggestionsWithDetails =
    await GetActivitySuggestionsWithDetailsCore(
      request,
      suggestedActivityGroup.suggestedActivityGroupId
    );
  if (activtySuggestionsWithDetails.error) {
    return sendError(res, {
      statusCode: 500,
      message: `❌  Failed to get newly created reccomendations: ${activtySuggestionsWithDetails.error}`,
    });
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: `Successfully gathered and stored ai suggestions for user: ${request.user.email}`,
    data: activtySuggestionsWithDetails.data,
  });
}
// Energy levels with lowercase string variants
const EnergyLevels = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  VERY_HIGH: "very_high",
};

// Mapping from those variants to ranges
const EnergyMappings = {
  [EnergyLevels.LOW]: { min: 0, max: 25 },
  [EnergyLevels.MEDIUM]: { min: 26, max: 50 },
  [EnergyLevels.HIGH]: { min: 51, max: 75 },
  [EnergyLevels.VERY_HIGH]: { min: 76, max: 100 },
};

async function gatherInformationForPrompt(request, lon, lat) {
  const dateFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  };
  // weather & timezone
  const rawWeatherData = await getWeatherData(lat, lon);

  if (!rawWeatherData) {
    console.error("Could not retrieve weather data.");
    return { error: 500, data: null };
  }

  const userTimezone = rawWeatherData.timezone;
  const weatherForLLM = processWeatherForLLM(rawWeatherData, userTimezone);

  console.log(
    `Current time for user ${weatherForLLM.current_time.toLocaleDateString(
      "en-us",
      dateFormatOptions
    )}`
  );
  console.log(`Current Weather: ${weatherForLLM.current_weather_summary}`);
  console.log(`Next 24-48h Forecast: ${weatherForLLM.forecast_summary}`);

  // energy level & mood
  const lastValidCheckin = (await lastValidCheckinHelper(request)).data;
  if (!lastValidCheckin) {
    return { error: 500, data: null };
  }
  console.log(
    `Last checkin results from ${lastValidCheckin.validAtDate.toLocaleDateString(
      "en-us",
      dateFormatOptions
    )} mood: ${lastValidCheckin.mood}, energy: ${lastValidCheckin.energy}% `
  );

  return {
    error: null,
    data: {
      checkin: lastValidCheckin,
      weather: weatherForLLM,
      noveltyPreference: true,
    },
  };
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const constructReccomendationPrompt = async (promptInfo) => `
You are an expert activity recommender. Your goal is to suggest the best activities for a user based on their current situation and past preferences.

User Profile:
- Current Energy Level: ${promptInfo.checkin.energy}%
- Current Mood: ${promptInfo.checkin.mood}
- Time of Day: ${promptInfo.weather.current_time}
- Current Weather: ${promptInfo.weather.current_weather_summary}
- Forecast (Next 24-48h): ${promptInfo.weather.forecast_summary}
- Willingness for Novelty: ${promptInfo.noveltyPreference ? "true" : "false"}

User statistics regarding previous activities: Work in progress / currently unavailable

Available Activities (choose 5 that are most fitting):
${promptInfo.activities
  ?.map(
    (activity) => `
${activity.name}
Id: ${activity.activityId}
Req energy: ${activity.energyRequired}
Est Duration: ${activity.estimatedDurationMinutes}m
Est Cost: ${
      activity.estimatedCost
        ? `${activity.estimatedCost} ${activity.currency}`
        : "Free"
    }
Dist: ${activity.distance}km
CanDoInGroup: ${activity.isGroupActivity ? "Yes" : "No"}
Categories: ${
      activity.categories
        ? activity.categories.map((cat) => cat.name).join(", ")
        : "N/A"
    }
`
  )
  .join("\n")}

Recommendation Task:
Based on the user's profile and the available activities, recommend 5 activities that are most suitable right now or in the next 48 hours.
For each recommendation, briefly explain *why* it's a good fit for the user, referencing their energy, mood, weather, and past preferences. 
Prioritize activities that align with their current energy and likely lead to a positive experience. Also, consider suggesting one "novel" activity if appropriate.

Our activity data comes from external sources and may not always have correctly labeled, "Is Group Activity" and "Energy Required" fields.
If you suspect these are incorrect please also provide your estimated value for these fields.`;

const handlePostAIApiCall = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          required: [
            "activityId",
            "confidence",
            "yourEstimatedRequiredEnergyLevel",
            "yourIsPossibleInGroupIdea",
            "reasoning",
          ],
          properties: {
            activityId: {
              type: Type.NUMBER,
            },
            confidence: {
              type: Type.NUMBER,
              minimum: 0,
              maximum: 1,
            },
            yourEstimatedRequiredEnergyLevel: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "very high"],
            },
            yourIsPossibleInGroupIdea: {
              type: Type.NUMBER,
              minimum: 0,
              maximum: 1,
              description: "0 = solo only, 1 = group possible",
            },
            reasoning: {
              type: Type.STRING,
            },
          },
        },
      },
    },
  });
  return response;
};
