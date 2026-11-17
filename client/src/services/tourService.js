const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getAreas() {
  const response = await fetch(`${API_BASE_URL}/areas`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load areas.");
  return data.areas || [];
}

export async function generateTour(formData) {
  const response = await fetch(`${API_BASE_URL}/tours/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not generate tour.");
  return data;
}
