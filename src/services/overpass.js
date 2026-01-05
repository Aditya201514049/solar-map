const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

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

  const maxAttempts = 3;
  const timeoutMs = 20000;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const url = OVERPASS_URLS[attempt % OVERPASS_URLS.length];
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        body: query,
        signal: controller.signal,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
      });

      if (!response.ok) {
        lastError = new Error(`Overpass API request failed (${response.status})`);
      } else {
        return response.json();
      }
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(t);
    }

    // Backoff before retrying
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }

  throw new Error(lastError?.message || "Overpass API request failed");
}

function areSamePoint(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

function closeRing(ring) {
  if (!Array.isArray(ring) || ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return areSamePoint(first, last) ? ring : [...ring, first];
}

function stitchWaysToRing(segments) {
  // segments: array of coordinate arrays (may be open). Returns one stitched ring or null.
  if (!Array.isArray(segments) || segments.length === 0) return null;

  const remaining = segments
    .map((s) => (Array.isArray(s) ? s.filter(Boolean) : []))
    .filter((s) => s.length >= 2);

  if (remaining.length === 0) return null;

  let current = [...remaining.shift()];

  while (remaining.length > 0) {
    const end = current[current.length - 1];
    let foundIndex = -1;
    let next = null;

    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      const segStart = seg[0];
      const segEnd = seg[seg.length - 1];

      if (areSamePoint(end, segStart)) {
        foundIndex = i;
        next = seg;
        break;
      }
      if (areSamePoint(end, segEnd)) {
        foundIndex = i;
        next = [...seg].reverse();
        break;
      }
    }

    if (foundIndex === -1) break;
    remaining.splice(foundIndex, 1);

    // Avoid duplicating the connecting point
    current = current.concat(next.slice(1));

    if (areSamePoint(current[0], current[current.length - 1])) {
      return closeRing(current);
    }
  }

  return areSamePoint(current[0], current[current.length - 1]) ? closeRing(current) : null;
}

/**
 * Convert raw Overpass API data into array of polygons for Leaflet
 */
export function parseBuildings(osmData) {
  if (!osmData || !osmData.elements) return [];

  const nodes = {};
  const ways = [];
  const relations = [];

  osmData.elements.forEach((el) => {
    if (el.type === "node") {
      nodes[el.id] = [el.lat, el.lon];
    } else if (el.type === "way") {
      ways.push(el);
    } else if (el.type === "relation") {
      relations.push(el);
    }
  });

  const waysById = {};
  ways.forEach((w) => {
    waysById[w.id] = w;
  });

  const usedWayIds = new Set();

  const relationPolygons = [];
  relations.forEach((rel) => {
    if (!rel || !Array.isArray(rel.members)) return;

    const outerWayIds = rel.members
      .filter((m) => m && m.type === "way" && (m.role === "outer" || m.role === ""))
      .map((m) => m.ref);

    if (outerWayIds.length === 0) return;

    const segments = outerWayIds
      .map((id) => waysById[id])
      .filter(Boolean)
      .map((way) => {
        usedWayIds.add(way.id);
        return way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean);
      });

    // Many multipolygons have closed outer ways already; stitch if needed.
    segments.forEach((seg) => {
      const ring = closeRing(seg);
      if (ring.length >= 4 && areSamePoint(ring[0], ring[ring.length - 1])) {
        relationPolygons.push(ring);
      }
    });

    // If outers were split into multiple open ways, try stitching them into a ring.
    const stitched = stitchWaysToRing(segments);
    if (stitched && stitched.length >= 4) {
      relationPolygons.push(stitched);
    }
  });

  const wayPolygons = ways
    .filter((way) => !usedWayIds.has(way.id))
    .map((way) => way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean));

  const polygons = relationPolygons.concat(wayPolygons);

  const cleaned = polygons
    .map((ring) => {
      if (!Array.isArray(ring) || ring.length === 0) return null;
      return closeRing(ring);
    })
    .filter((ring) => Array.isArray(ring) && ring.length >= 4);

  return cleaned;
}
