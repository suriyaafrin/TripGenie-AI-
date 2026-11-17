
function parseTime(time) {
    if (typeof time !== "string") return null;

    const match = time.trim().match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
    );

    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (minutes < 0 || minutes > 59) return null;

    if (period) {
        if (hours < 1 || hours > 12) return null;

        if (period === "AM") {
            hours = hours === 12 ? 0 : hours;
        } else {
            hours = hours === 12 ? 12 : hours + 12;
        }
    } else if (hours < 0 || hours > 23) {
        return null;
    }

    return hours * 60 + minutes;
}

// Parse a stop time range
function parseTimeRange(time) {
    if (typeof time !== "string") return null;

    const parts = time.trim().split(
        /\s*(?:-|–|—|\bto\b)\s*/i
    );

    if (parts.length !== 2) return null;

    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);

    if (start === null || end === null || end <= start) {
        return null;
    }

    return { start, end };
}

export function validateItinerary(
    aiResult,
    places,
    budget,
    timeWindow = {}
) {
    // 1. Flatten nested place arrays
    const allPlaces = (Array.isArray(places) ? places : [])
        .flat(Infinity)
        .filter(
            (place) =>
                place &&
                typeof place === "object" &&
                !Array.isArray(place) &&
                place.id !== null &&
                place.id !== undefined &&
                String(place.id).trim() !== ""
        );

    // 2. Create a map using normalized IDs
    const placeMap = new Map(
        allPlaces.map((place) => [
            String(place.id).trim(),
            place
        ])
    );

    // 3. Validate tour start and end time
    const tourStart = parseTime(timeWindow.startTime);
    const tourEnd = parseTime(timeWindow.endTime);

    const validTimeWindow =
        tourStart !== null &&
        tourEnd !== null &&
        tourEnd > tourStart;

    const seen = new Set();

    const geminiStops = Array.isArray(aiResult?.stops)
        ? aiResult.stops
        : [];

    // 4. Validate place IDs and duplicates
    const matchedStops = geminiStops
        .filter((stop) => {
            if (
                !stop ||
                stop.placeId === null ||
                stop.placeId === undefined ||
                String(stop.placeId).trim() === ""
            ) {
                return false;
            }

            const placeId = String(stop.placeId).trim();

            if (!placeMap.has(placeId) || seen.has(placeId)) {
                return false;
            }

            seen.add(placeId);
            return true;
        })
        .map((stop) => {
            const placeId = String(stop.placeId).trim();
            const realPlace = placeMap.get(placeId);

            // 5. Get cost only from original dataset
            const rawCost = realPlace.estimatedCost;

            const validCost =
                rawCost !== null &&
                rawCost !== undefined &&
                rawCost !== "" &&
                Number.isFinite(Number(rawCost)) &&
                Number(rawCost) >= 0;

            return {
                placeId: String(realPlace.id).trim(),

                area: realPlace.area || "Information unavailable",

                place: realPlace.name || "Unknown place",

                category: realPlace.category || "Information unavailable",

                location: realPlace.location || null,

                verified: realPlace.verified === true,

                time:
                    typeof stop.time === "string" && stop.time.trim()
                        ? stop.time
                        : "Information unavailable",

                estimatedCost: validCost
                    ? Number(rawCost)
                    : null,

                costType: realPlace.costType || "unknown",

                costNote:
                    realPlace.costNote || "Cost information unavailable.",

                reason:
                    typeof stop.reason === "string" && stop.reason.trim()
                        ? stop.reason
                        : "Information unavailable",

                tip:
                    typeof stop.tip === "string" && stop.tip.trim()
                        ? stop.tip
                        : "Information unavailable.",

                openingHours:
                    realPlace.openingHours || "Information unavailable"
            };
        });

    // 6. Validate stop times and chronological order
    let previousEnd = tourStart;
    let invalidTimeStops = 0;

    const validStops = validTimeWindow
        ? matchedStops.filter((stop) => {
            const timeRange = parseTimeRange(stop.time);

            if (
                !timeRange ||
                timeRange.start < tourStart ||
                timeRange.end > tourEnd ||
                timeRange.start < previousEnd
            ) {
                invalidTimeStops++;
                return false;
            }

            previousEnd = timeRange.end;
            return true;
        })
        : [];

    // 7. Calculate only known costs
    const knownCosts = validStops
        .filter((stop) => stop.estimatedCost !== null)
        .map((stop) => stop.estimatedCost);

    const totalEstimatedCost = knownCosts.reduce(
        (sum, cost) => sum + cost,
        0
    );

    // 8. Check unknown costs
    const hasUnknownCosts = validStops.some(
        (stop) => stop.estimatedCost === null
    );

    // 9. Validate budget
    const numericBudget = Number(budget);

    const validBudget =
        budget !== null &&
        budget !== undefined &&
        budget !== "" &&
        Number.isFinite(numericBudget) &&
        numericBudget >= 0;

    const budgetCheckComplete =
        validBudget && !hasUnknownCosts;

    // 10. Return validated itinerary
    return {
        summary:
            typeof aiResult?.summary === "string" &&
            aiResult.summary.trim()
                ? aiResult.summary
                : "Your tour plan is ready.",

        stops: validStops,

        totalEstimatedCost,

        hasUnknownCosts,

        budgetCheckComplete,

        withinBudget: budgetCheckComplete
            ? totalEstimatedCost <= numericBudget
            : false,

        timeValidationComplete: validTimeWindow,

        invalidTimeStops
    };
}
