import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

function MapClickHandler({ setClickedPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log("Clicked:", lat, lng);
      setClickedPosition({ lat, lng });
    },
  });
  return null;
}

function RecenterOnPosition({ clickedPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!clickedPosition) return;
    map.setView([clickedPosition.lat, clickedPosition.lng], map.getZoom(), {
      animate: true,
    });
  }, [clickedPosition, map]);

  return null;
}

const MapView = ({ setClickedPosition, clickedPosition }) => {
  const [polygons, setPolygons] = useState([]);

  // TEMP: expose setter globally for testing
  useEffect(() => {
    window.__setBuildingPolygons = setPolygons;
  }, []);

  return (
    <MapContainer
      center={[24.7359, 91.6852]} // Sylhet default
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler setClickedPosition={setClickedPosition} />

      <RecenterOnPosition clickedPosition={clickedPosition} />

      {clickedPosition && (
        <Marker position={[clickedPosition.lat, clickedPosition.lng]} />
      )}

      {/* Render building polygons */}
      {polygons.map((polygon, index) => (
        <Polygon
          key={index}
          positions={polygon}
          pathOptions={{
            color: "blue",
            weight: 1,
            fillOpacity: 0.4,
          }}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
