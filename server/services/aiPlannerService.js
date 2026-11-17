
import { GoogleGenAI } from "@google/genai";
import { TRAVEL_BUFFER_MINUTES } from "../config.js";

function getAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
        "GEMINI_API_KEY is missing. Add it to server/.env."
    );
  }

  if (!process.env.GEMINI_MODEL) {
    throw new Error(
        "GEMINI_MODEL is missing. Add a supported model name to server/.env."
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      timeout: 60000
    }
  });
}

const SYSTEM_INSTRUCTION = `
You are TripGenie, a careful one-day tour planner for Dhaka, Bangladesh.

STRICT DATA RULES:
- Use ONLY exact place IDs from the supplied PLACES JSON array.
- Never invent, modify, or create a placeId.
- Every returned placeId MUST exactly match one supplied ID.
- You may use both verified and unverified places.
- Prefer verified places whenever suitable alternatives exist.
- Never describe an unverified place as verified.
- Never invent a place, price, rating, opening time, coordinate, or visitor fact.
- Do not create a stop if the supplied data is insufficient.
- If openingHours is "Information unavailable", do not claim the place is open.
- If location is unavailable, do not invent a location.
- Never invent or modify estimated costs.
- If cost is null or unknown, do not assume the place is free.
- Never treat an unknown cost as a confirmed zero cost.
- Use supplied cost information only.

VERIFICATION RULES:
- A place with verified: true is a verified place.
- A place with verified: false is an unverified place.
- Keep the verification status accurate.
- Do not claim that unverified information has been checked.
- Prefer verified places, but use suitable unverified places if needed.
- Do not reject a suitable place only because its verification status is false.

PLANNING RULES:
- Respect the user's selected areas, time window, budget, and interests.
- Prioritize places from the areas selected by the user.
- Group stops by area and avoid unnecessary backtracking.
- When changing areas, include at least ${TRAVEL_BUFFER_MINUTES} minutes as a travel buffer.
- Include sensible meal/rest breaks when appropriate.
- Keep total known estimated costs within budget where possible.
- Unknown costs must not be counted as zero.
- Use only the requested time window.
TIME RULES:
- Every stop must have a valid start and end time.
- Use this exact format: "09:00 AM - 10:00 AM".
- All stops must be within the user's requested startTime and endTime.
- Stops must be in chronological order.
- A stop must not overlap with the previous stop.
- Never generate a stop outside the requested tour time.
MULTIPLE STOP RULES:
- Aim to return 3 to 5 suitable stops for a full-day tour.
- If at least 3 suitable places are available, try to return at least 3 different stops.
- If 4 or 5 suitable places are available, prefer using them.
- Never return only one stop when multiple suitable places are available.
- If fewer than 3 suitable places are available, return all suitable available places.
- Never repeat the same place.
- Select different places that match the user's interests.
- Distribute available time reasonably among selected stops.
- Do not add unsuitable places just to increase stop count.
- Return fewer stops rather than inventing places.

OUTPUT RULES:
- Do not return only the budget or a generic summary.
- Each stop must have a valid time, reason, and helpful tip.
- Do not claim opening hours or entry fees are verified unless the dataset confirms them.
- Return valid JSON only.

JSON FORMAT:
{
  "summary": "short overview",
  "stops": [
    {
      "placeId": "an exact ID from PLACES",
      "time": "HH:MM - HH:MM",
      "estimatedCost": 0,
      "reason": "why this stop fits",
      "tip": "short grounded tip"
    }
  ]
}

IMPORTANT:
The estimatedCost field must not be used to invent or override dataset costs.
The server will calculate the final costs from the original dataset.
`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryError(error) {
  const status = Number(error.status || error.code);

  if (status === 429 || (status >= 400 && status < 500)) {
    return false;
  }

  if ([500, 502, 503, 504].includes(status)) {
    return true;
  }

  const code = error.cause?.code || error.code;

  if (
      code === "UND_ERR_HEADERS_TIMEOUT" ||
      code === "UND_ERR_CONNECT_TIMEOUT" ||
      code === "ECONNRESET" ||
      code === "ETIMEDOUT"
  ) {
    return true;
  }

  return (
      error.message?.includes("fetch failed") ||
      error.message?.includes("503") ||
      error.message?.includes("504") ||
      error.message?.includes("UNAVAILABLE") ||
      error.message?.includes("DEADLINE_EXCEEDED")
  );
}

function getModelFallbacks() {
  return [
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash-lite"
  ].filter((model, index, arr) =>
      model && arr.indexOf(model) === index
  );
}

async function tryGenerate(ai, model, prompt) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  const result = JSON.parse(response.text);

  if (!result || !Array.isArray(result.stops)) {
    throw new Error(
        "Invalid itinerary structure returned by Gemini."
    );
  }

  console.log("GEMINI SUMMARY:", result.summary);
  console.log("GEMINI STOPS:", result.stops.length);

  return result;
}

export async function generateTour(userInput, places) {
  const ai = getAIClient();

  if (!Array.isArray(places)) {
    throw new Error("Places data must be an array.");
  }

  // 1. Flatten nested arrays
  places = places.flat(Infinity);

  // 2. Accept both verified and unverified places
  places = places.filter(
      (place) =>
          place &&
          typeof place === "object" &&
          !Array.isArray(place) &&
          place.id !== null &&
          place.id !== undefined &&
          String(place.id).trim() !== ""
  );

  if (places.length === 0) {
    throw new Error(
        "No places available for tour planning."
    );
  }

  // 3. Remove duplicate place IDs
  const uniquePlaces = new Map();

  for (const place of places) {
    const id = String(place.id).trim();

    if (id && !uniquePlaces.has(id)) {
      uniquePlaces.set(id, place);
    }
  }

  places = Array.from(uniquePlaces.values());

  const verifiedCount = places.filter(
      (place) => place.verified === true
  ).length;

  const unverifiedCount = places.length - verifiedCount;

  // 4. Debug information
  console.log("================================");
  console.log("TOTAL AVAILABLE PLACES:", places.length);
  console.log("VERIFIED PLACES:", verifiedCount);
  console.log("UNVERIFIED PLACES:", unverifiedCount);

  console.log(
      "AVAILABLE PLACES:",
      places.map((place) => ({
        id: place.id,
        name: place.name,
        area: place.area,
        category: place.category,
        verified: place.verified,
        estimatedCost: place.estimatedCost
      }))
  );

  console.log("================================");

  // 5. Prepare Gemini prompt
  const prompt = `
USER REQUEST:

Areas: ${(userInput.areas || []).join(", ")}
Budget: ${userInput.budget} BDT
Start Time: ${userInput.startTime}
End Time: ${userInput.endTime}
Interests: ${(userInput.interests || []).join(", ")}
Additional Note: ${userInput.note || "none"}

IMPORTANT PLANNING INSTRUCTIONS:

1. Use only exact placeId values from the supplied PLACES JSON.
2. Both verified and unverified places are available.
3. Prefer verified places when suitable.
4. You may select suitable unverified places when needed.
5. Never describe an unverified place as verified.
6. Respect the user's selected areas.
7. Respect the user's budget and time window.
8. Do not assume unknown costs are free.
9. Try to select 3 to 5 suitable different places.
10. If multiple suitable places are available, select multiple places.
11. If only one suitable place exists, return only that place.
12. Never repeat a place.
13. Match places with the user's interests.
14. Give every stop a reasonable time, reason, and tip.
15. Respect the ${TRAVEL_BUFFER_MINUTES}-minute travel buffer when changing areas.
16. Never invent missing information.
17. Do not claim a place is open when opening hours are unavailable.
18. Do not invent location or entry fee information.

PLACES JSON:
${JSON.stringify(places)}
`;

  // 6. Try available models
  const models = getModelFallbacks();
  const maxAttemptsPerModel = 3;

  let lastError = null;

  for (const model of models) {
    for (
        let attempt = 1;
        attempt <= maxAttemptsPerModel;
        attempt++
    ) {
      try {
        console.log(
            `Gemini request: model=${model}, attempt ${attempt}/${maxAttemptsPerModel}`
        );

        const result = await tryGenerate(ai, model, prompt);

        console.log(`Gemini success with model=${model}`);

        // 7. Match Gemini IDs with original dataset
        const placeMap = new Map(
            places.map((place) => [
              String(place.id).trim(),
              place
            ])
        );

        const seen = new Set();

        const enrichedStops = result.stops
            .map((stop) => {
              const id = String(stop?.placeId ?? "").trim();

              const place = placeMap.get(id);

              if (!place) {
                console.warn(
                    "Unknown placeId returned by Gemini:",
                    stop?.placeId
                );

                return null;
              }

              if (seen.has(id)) {
                console.warn("Duplicate place removed:", id);
                return null;
              }

              seen.add(id);

              return {
                ...stop,

                placeId: String(place.id).trim(),
                place: place.name,
                area: place.area,
                category: place.category,

                location: place.location || null,

                verified: place.verified === true,

                estimatedCost: place.estimatedCost ?? null,
                costType: place.costType || "unknown",
                costNote:
                    place.costNote || "Cost information unavailable.",

                openingHours:
                    place.openingHours ||
                    "Information unavailable"
              };
            })
            .filter(Boolean);

        if (enrichedStops.length === 0) {
          throw new Error(
              "Gemini returned no stops matching available places."
          );
        }

        const finalTour = {
          ...result,
          stops: enrichedStops
        };

        console.log("================================");
        console.log(
            "FINAL TOUR STOPS:",
            finalTour.stops.length
        );

        console.log(
            "FINAL PLACE NAMES:",
            finalTour.stops.map((stop) => ({
              name: stop.place,
              verified: stop.verified
            }))
        );

        console.log("================================");

        return finalTour;

      } catch (error) {
        lastError = error;

        console.error(
            `Gemini [${model}] attempt ${attempt} failed:`,
            error.message
        );

        const temporary = isTemporaryError(error);

        const isLastAttempt =
            attempt === maxAttemptsPerModel;

        if (!temporary || isLastAttempt) {
          break;
        }

        const delay =
            Math.pow(2, attempt - 1) * 1000 +
            Math.random() * 1000;

        console.log(
            `Retrying in ${Math.round(delay)}ms...`
        );

        await wait(delay);
      }
    }

    console.warn(
        `Model ${model} exhausted. Trying next model...`
    );
  }

  throw (
      lastError ||
      new Error("Gemini could not generate the tour.")
  );
}
