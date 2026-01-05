import MapView from "./components/Map/MapView";
import { useEffect, useState } from "react";
import { fetchNearbyBuildings, parseBuildings } from "./services/overpass";
import SearchBox from "./components/Search/SearchBox";
import { geocodeAddress } from "./services/geocoding";

function App() {
  const [clickedPosition, setClickedPosition] = useState(null);

  useEffect(() => {
    if (!clickedPosition) return;

    fetchNearbyBuildings(clickedPosition.lat, clickedPosition.lng)
      .then((data) => {
        const polygons = parseBuildings(data);
        console.log("PARSED POLYGONS:", polygons);

        // send polygons to MapView
        if (window.__setBuildingPolygons) {
          window.__setBuildingPolygons(polygons);
        }
      })
      .catch(console.error);
  }, [clickedPosition]);

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
      <MapView
        setClickedPosition={setClickedPosition}
        clickedPosition={clickedPosition}
      />
    </div>
  );
}

export default App;
