# TripGenie AI — Dhaka Tour Planner

A beginner-friendly React + Tailwind frontend and Node.js + Express backend using Google Gemini to create one-day Dhaka itineraries.

## Requirements
- Node.js 20+ recommended
- A Google Gemini API key from Google AI Studio
- JavaScript only (no TypeScript)

## Project structure
```text
tripgenie-ai/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── TourForm.jsx
│       │   ├── ItineraryTimeline.jsx
│       │   ├── PlaceCard.jsx
│       │   └── BudgetSummary.jsx
│       ├── pages/Home.jsx
│       ├── services/tourService.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── server/
    ├── .env.example
    ├── package.json
    ├── config.js
    ├── data/places/dhanmondi.json
    ├── routes/tourRoutes.js
    ├── controllers/tourController.js
    └── services/
        ├── placeService.js
        ├── aiPlannerService.js
        └── validateItinerary.js
```

## 1. Install dependencies

Open two terminals.

### Terminal 1 — backend
```bash
cd tripgenie-ai/server
npm install
```

Copy `.env.example` to `.env`, then add your key and a currently available Gemini Flash model name from Google AI Studio:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=your_flash_model_name
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Never put the Gemini key in the React app or commit `.env` to GitHub.

Start the backend:
```bash
npm run dev
```

### Terminal 2 — frontend
```bash
cd tripgenie-ai/client
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

## 2. Add verified places before generating a tour

The included `server/data/places/dhanmondi.json` is intentionally an empty array (`[]`).
The specification requires verified place information and prohibits the AI from inventing places, prices, or opening times. No verified place dataset was supplied with the requirements, so this starter does not fabricate one.

Add researched records to that file using this shape:

```json
[
  {
    "id": "dhanmondi-001",
    "name": "Verified place name",
    "area": "Dhanmondi",
    "category": "park",
    "location": { "lat": 23.7461, "lng": 90.3742 },
    "openingHours": "Information unavailable",
    "avgCost": 0,
    "rating": null,
    "bestTime": "evening",
    "visitDurationMinutes": 60,
    "notes": "Verified visitor tip"
  }
]
```

Use actual researched values. Use `"Information unavailable"` or `null` when a value is unknown. Categories supported by the form/data are `food`, `park`, `shopping`, `culture`, and `snacks`.

To add another area, create another JSON file, for example `gulshan.json`. The area name shown in the UI is generated from the JSON filename.

## 3. API endpoints

- `GET /api/health` — backend health check
- `GET /api/areas` — list configured area files
- `POST /api/tours/generate` — generate a tour

Example request:
```json
{
  "areas": ["Dhanmondi"],
  "budget": 1500,
  "startTime": "10:00",
  "endTime": "20:00",
  "interests": ["food", "park"],
  "note": "Lake-er pashe shanto jayga ar sosta khabar chai"
}
```

## Important safeguards
- The Gemini API key is read only by the backend.
- Gemini receives only selected area place records and trip preferences.
- Gemini is instructed to choose only supplied `placeId` values.
- The backend drops unknown IDs and derives displayed place names/areas/coordinates from trusted JSON.
- The backend recalculates estimated total cost and reports whether the plan is within budget.
- Maximum two areas per day; area changes receive a configurable 45-minute travel buffer.
- Missing place data returns an information-unavailable response rather than invented details.

## Current starter limitations
- The itinerary map component is not included yet; coordinates are returned by the API and ready for a map integration.
- Travel time between areas is a configurable planning buffer, not live traffic data.
- Costs and opening hours are estimates based on your JSON dataset; keep that dataset updated.
- Gemini model names and free-tier limits can change. Set `GEMINI_MODEL` to a currently available Flash model in Google AI Studio.
