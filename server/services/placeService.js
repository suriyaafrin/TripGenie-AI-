
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const PLACES_DIR = path.join(currentDir, "../data/places");

// Convert area name into JSON filename format.
// Example: "Old Dhaka" -> "old-dhaka"
function toSlug(area) {
  return String(area)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
}

// Get available areas from JSON filenames.
export async function getAvailableAreas() {
  const files = await fs.readdir(PLACES_DIR);

  return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/i, ""))
      .map((slug) =>
          slug
              .split("-")
              .map((part) =>
                  part.charAt(0).toUpperCase() + part.slice(1)
              )
              .join(" ")
      );
}

// Read places from the selected area's JSON file.
export async function getPlacesByArea(area) {
  const filePath = path.join(
      PLACES_DIR,
      `${toSlug(area)}.json`
  );

  try {
    const rawData = await fs.readFile(filePath, "utf8");
    const places = JSON.parse(rawData);

    if (!Array.isArray(places)) {
      console.error(`Invalid places JSON format: ${filePath}`);
      return [];
    }

    return places;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Area JSON file not found: ${filePath}`);
      return [];
    }

    throw error;
  }
}
