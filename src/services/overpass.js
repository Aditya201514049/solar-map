const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * Fetch nearby buildings from OpenStreetMap (raw data)
 */
export async function fetchNearbyBuildings(lat, lng, radius = 300) {
  const query = `
    [out:json];
    (
      way["building"](around:${radius},${lat},${lng});
      relation["building"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error("Overpass API request failed");
  }

  return response.json();
}

/**
 * Convert raw Overpass API data into array of polygons for Leaflet
 */
export function parseBuildings(osmData) {
  if (!osmData || !osmData.elements) return [];

  const nodes = {};
  const ways = [];

  osmData.elements.forEach((el) => {
    if (el.type === "node") {
      nodes[el.id] = [el.lat, el.lon];
    } else if (el.type === "way") {
      ways.push(el);
    }
  });

  const polygons = ways.map((way) =>
    way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean)
  );

  return polygons;
}
