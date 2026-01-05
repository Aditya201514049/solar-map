import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
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

const MapView = ({
  setClickedPosition,
  clickedPosition,
  polygons,
  selectedBuildingIndex,
  onSelectBuilding,
}) => {
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
            color: index === selectedBuildingIndex ? "red" : "blue",
            weight: index === selectedBuildingIndex ? 2 : 1,
            fillOpacity: index === selectedBuildingIndex ? 0.55 : 0.4,
          }}
          eventHandlers={{
            click: (e) => {
              e?.originalEvent?.stopPropagation?.();
              onSelectBuilding(index);
            },
          }}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
