
import {
  getAvailableAreas,
  getPlacesByArea
} from "../services/placeService.js";

import { generateTour } from "../services/aiPlannerService.js";
import { validateItinerary } from "../services/validateItinerary.js";

import {
  MAX_AREAS,
  MAX_PLACES_PER_REQUEST
} from "../config.js";

// Get all available areas
export async function listAreas(_req, res, next) {
  try {
    const areas = await getAvailableAreas();
    res.json({ areas });
  } catch (error) {
    next(error);
  }
}

// Validate 24-hour time format (HH:mm)
function isValidTime(value) {
  return (
      typeof value === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

// Create a tour
export async function createTour(req, res) {
  try {
    const {
      areas,
      budget,
      startTime,
      endTime,
      interests = [],
      note = ""
    } = req.body;

    // 1. Validate user input
    if (
        !Array.isArray(areas) ||
        areas.length === 0 ||
        !Number.isFinite(Number(budget)) ||
        Number(budget) <= 0 ||
        !isValidTime(startTime) ||
        !isValidTime(endTime) ||
        !Array.isArray(interests) ||
        typeof note !== "string"
    ) {
      return res.status(400).json({
        error: "Please provide valid areas, budget, times, interests and note."
      });
    }

    // 2. Check maximum selected areas
    if (areas.length > MAX_AREAS) {
      return res.status(400).json({
        error: `Maximum ${MAX_AREAS} areas allowed in one day.`
      });
    }

    // 3. Check time range
    if (startTime >= endTime) {
      return res.status(400).json({
        error: "End time must be later than start time."
      });
    }

    // 4. Normalize and remove duplicate area names
    const selectedAreas = [
      ...new Map(
          areas.map((area) => [
            String(area).trim().toLowerCase(),
            String(area).trim()
          ])
      ).values()
    ];

    // 5. Validate selected areas
    const availableAreas = await getAvailableAreas();

    const areaMap = new Map(
        availableAreas.map((area) => [
          area.trim().toLowerCase(),
          area
        ])
    );

    const unknownAreas = selectedAreas.filter(
        (area) => !areaMap.has(area.toLowerCase())
    );

    if (unknownAreas.length > 0) {
      return res.status(400).json({
        error: `Area not configured: ${unknownAreas.join(", ")}`
      });
    }

    // Use official area names
    const normalizedAreas = selectedAreas.map(
        (area) => areaMap.get(area.toLowerCase())
    );

    // 6. Load both verified and unverified places
    let places = [];

    for (const area of normalizedAreas) {
      const areaPlaces = await getPlacesByArea(area);

      const availablePlaces = areaPlaces.filter(
          (place) =>
              place &&
              typeof place === "object" &&
              !Array.isArray(place) &&
              place.id !== null &&
              place.id !== undefined &&
              String(place.id).trim() !== ""
      );

      const verifiedCount = availablePlaces.filter(
          (place) => place.verified === true
      ).length;

      const unverifiedCount =
          availablePlaces.length - verifiedCount;

      console.log(
          `AREA: ${area} | TOTAL: ${areaPlaces.length} | VERIFIED: ${verifiedCount} | UNVERIFIED: ${unverifiedCount}`
      );

      places.push(...availablePlaces);
    }

    // 7. Remove duplicate place IDs
    places = [
      ...new Map(
          places.map((place) => [
            String(place.id).trim(),
            place
          ])
      ).values()
    ];

    console.log("TOTAL AVAILABLE PLACES:", places.length);

    console.log(
        "AVAILABLE PLACES:",
        places.map((place) => ({
          id: place.id,
          name: place.name,
          area: place.area,
          category: place.category,
          verified: place.verified
        }))
    );

    // 8. Check available places
    if (places.length === 0) {
      return res.status(404).json({
        error: "No places found in the selected areas. Check the area JSON files."
      });
    }

    // 9. Limit places sent to Gemini
    places = places.slice(0, MAX_PLACES_PER_REQUEST);

    console.log(
        "PLACES SENT TO GEMINI:",
        places.length
    );

    // 10. Prepare user input
    const userInput = {
      areas: normalizedAreas,
      budget: Number(budget),
      startTime,
      endTime,
      interests,
      note
    };

    // 11. Generate itinerary using Gemini
    const aiResult = await generateTour(userInput, places);

    console.log(
        "GEMINI GENERATED STOPS:",
        aiResult.stops?.length || 0
    );

    // 12. Validate Gemini result, including stop times
    const tour = validateItinerary(
        aiResult,
        places,
        Number(budget),
        {
          startTime,
          endTime
        }
    );

    console.log(
        "FINAL VALIDATED STOPS:",
        tour.stops.length
    );

    console.log(
        "INVALID TIME STOPS:",
        tour.invalidTimeStops
    );

    console.log(
        "TIME VALIDATION COMPLETE:",
        tour.timeValidationComplete
    );

    console.log(
        "BUDGET CHECK COMPLETE:",
        tour.budgetCheckComplete
    );

    // 13. Send response
    return res.json({
      areas: normalizedAreas,
      budget: Number(budget),
      startTime,
      endTime,
      ...tour
    });

  } catch (error) {
    console.error("Tour generation failed:", error);

    const errorCode =
        error.status ||
        error.cause?.code ||
        error.code;

    // Gemini rate limit
    if (Number(errorCode) === 429) {
      return res.status(429).json({
        error: "Gemini request limit reached. Please try again later."
      });
    }

    // Gemini temporary server issue
    if ([500, 502, 503, 504].includes(Number(errorCode))) {
      return res.status(503).json({
        error: "Gemini is temporarily unavailable. Please try again."
      });
    }

    // Network timeout
    if (
        errorCode === "UND_ERR_HEADERS_TIMEOUT" ||
        errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
        errorCode === "ETIMEDOUT" ||
        error.message?.includes("fetch failed")
    ) {
      return res.status(504).json({
        error: "Gemini response timed out. Please try again."
      });
    }

    // Invalid AI JSON
    if (error instanceof SyntaxError) {
      return res.status(502).json({
        error: "AI returned invalid JSON. Please try again."
      });
    }

    // Environment configuration
    if (
        error.message?.includes("GEMINI_API_KEY") ||
        error.message?.includes("GEMINI_MODEL")
    ) {
      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Could not generate the tour. Please try again."
    });
  }
}
