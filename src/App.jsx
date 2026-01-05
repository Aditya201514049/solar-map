import MapView from "./components/Map/MapView";
import { useEffect, useState } from "react";
import { fetchNearbyBuildings, parseBuildings } from "./services/overpass";
import SearchBox from "./components/Search/SearchBox";
import { geocodeAddress } from "./services/geocoding";

function App() {
  const [clickedPosition, setClickedPosition] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [buildingsCount, setBuildingsCount] = useState(0);
  const [radius, setRadius] = useState(300);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(null);

  useEffect(() => {
    if (!clickedPosition) return;

    let cancelled = false;
    setIsLoadingBuildings(true);
    setBuildingsError(null);
    setSelectedBuildingIndex(null);

    fetchNearbyBuildings(clickedPosition.lat, clickedPosition.lng, radius)
      .then((data) => {
        if (cancelled) return;
        const parsed = parseBuildings(data);
        console.log("PARSED POLYGONS:", parsed);
        setPolygons(parsed);
        setBuildingsCount(parsed.length);
      })
      .catch((err) => {
        if (cancelled) return;
        setPolygons([]);
        setBuildingsCount(0);
        setSelectedBuildingIndex(null);
        setBuildingsError(err?.message || "Failed to load buildings");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingBuildings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clickedPosition, radius]);

  const handleSearch = async (query) => {
    const result = await geocodeAddress(query);
    if (!result) {
      alert("Address not found");
      return;
    }
    setClickedPosition({ lat: result.lat, lng: result.lng });
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      <SearchBox onSearch={handleSearch} />
      <div
        style={{ position: "fixed", top: 64, left: 64, zIndex: 2000 }}
        className="bg-white/90 text-black px-3 py-2 rounded shadow text-sm"
      >
        {clickedPosition ? (
          <>
            {isLoadingBuildings
              ? "Loading buildings…"
              : `Buildings in ${radius}m: ${buildingsCount}`}
            {buildingsError ? ` — Error: ${buildingsError}` : null}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Radius</span>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
                <span className="whitespace-nowrap">{radius}m</span>
              </div>
            </div>
          </>
        ) : (
          "Click on the map or search a place"
        )}
      </div>

      {selectedBuildingIndex !== null && polygons[selectedBuildingIndex] ? (
        <div
          style={{ position: "fixed", top: 128, left: 64, zIndex: 2000 }}
          className="bg-white/90 text-black px-3 py-2 rounded shadow text-sm"
        >
          {`Selected building: ${selectedBuildingIndex + 1} / ${polygons.length}`}
          <div>{`Points: ${polygons[selectedBuildingIndex].length}`}</div>
        </div>
      ) : null}
      <MapView
        setClickedPosition={setClickedPosition}
        clickedPosition={clickedPosition}
        polygons={polygons}
        selectedBuildingIndex={selectedBuildingIndex}
        onSelectBuilding={setSelectedBuildingIndex}
      />
    </div>
  );
}

export default App;
