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
  const [radiusInput, setRadiusInput] = useState(300);
  const [radius, setRadius] = useState(300);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showBuildings, setShowBuildings] = useState(true);

  const handleClear = () => {
    setClickedPosition(null);
    setPolygons([]);
    setBuildingsCount(0);
    setBuildingsError(null);
    setIsLoadingBuildings(false);
    setSelectedBuildingIndex(null);
    setShowOnlySelected(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setRadius(radiusInput);
    }, 400);

    return () => clearTimeout(t);
  }, [radiusInput]);

  useEffect(() => {
    if (!clickedPosition) return;

    if (!showBuildings) {
      setIsLoadingBuildings(false);
      setBuildingsError(null);
      setPolygons([]);
      setBuildingsCount(0);
      return;
    }

    let cancelled = false;
    setIsLoadingBuildings(true);
    setBuildingsError(null);

    fetchNearbyBuildings(clickedPosition.lat, clickedPosition.lng, radius)
      .then((data) => {
        if (cancelled) return;
        const parsed = parseBuildings(data);
        console.log("PARSED POLYGONS:", parsed);
        setPolygons(parsed);
        setBuildingsCount(parsed.length);

        if (
          selectedBuildingIndex !== null &&
          (selectedBuildingIndex < 0 || selectedBuildingIndex >= parsed.length)
        ) {
          setSelectedBuildingIndex(null);
          setShowOnlySelected(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setBuildingsError(err?.message || "Failed to load buildings");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingBuildings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clickedPosition, radius, selectedBuildingIndex]);

  useEffect(() => {
    if (showBuildings) return;
    setSelectedBuildingIndex(null);
    setShowOnlySelected(false);
  }, [showBuildings]);

  const handleSearch = async (query) => {
    const result = await geocodeAddress(query);
    if (!result) {
      alert("Address not found");
      return;
    }
    setClickedPosition({ lat: result.lat, lng: result.lng });
  };

  const handleSelectBuilding = (index) => {
    setSelectedBuildingIndex(index);
    if (index === null) {
      setShowOnlySelected(false);
    } else {
      setShowOnlySelected(true);
    }
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
            {showBuildings ? (
              <>
                {isLoadingBuildings
                  ? "Loading buildings…"
                  : `Buildings in ${radius}m: ${buildingsCount}`}
                {buildingsError ? ` — Error: ${buildingsError}` : null}
              </>
            ) : (
              "Buildings hidden"
            )}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Radius</span>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                />
                <span className="whitespace-nowrap">{radiusInput}m</span>
              </div>
            </div>

            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={showBuildings}
                onChange={(e) => setShowBuildings(e.target.checked)}
              />
              <span>Show buildings</span>
            </label>

            <button
              type="button"
              className="mt-2 bg-gray-200 px-2 py-1 rounded"
              onClick={handleClear}
            >
              Clear
            </button>
          </>
        ) : (
          "Click on the map or search a place"
        )}
      </div>

      {showBuildings &&
      selectedBuildingIndex !== null &&
      polygons[selectedBuildingIndex] ? (
        <div
          style={{ position: "fixed", top: 128, left: 64, zIndex: 2000 }}
          className="bg-white/90 text-black px-3 py-2 rounded shadow text-sm"
        >
          {`Selected building: ${selectedBuildingIndex + 1} / ${polygons.length}`}
          <div>{`Points: ${polygons[selectedBuildingIndex].length}`}</div>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlySelected}
              onChange={(e) => setShowOnlySelected(e.target.checked)}
            />
            <span>Show only selected</span>
          </label>
          <button
            type="button"
            className="mt-2 bg-gray-200 px-2 py-1 rounded"
            onClick={() => handleSelectBuilding(null)}
          >
            Clear selection
          </button>
        </div>
      ) : null}
      <MapView
        setClickedPosition={setClickedPosition}
        clickedPosition={clickedPosition}
        polygons={polygons}
        selectedBuildingIndex={selectedBuildingIndex}
        onSelectBuilding={handleSelectBuilding}
        showOnlySelected={showOnlySelected}
        showBuildings={showBuildings}
      />
    </div>
  );
}

export default App;
