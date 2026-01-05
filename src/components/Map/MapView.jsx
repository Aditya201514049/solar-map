import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapClickHandler({ setClickedPosition }) {
  useMapEvents({
    click(e) {
      const target = e?.originalEvent?.target;
      if (target?.closest?.(".leaflet-interactive")) {
        return;
      }
      const { lat, lng } = e.latlng;
      console.log("Clicked:", lat, lng);
      setClickedPosition({ lat, lng });
    },
  });
  return null;
}

function FitBoundsOnSelection({ selectedPolygon, enabled }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    if (!Array.isArray(selectedPolygon) || selectedPolygon.length < 2) return;

    const bounds = L.latLngBounds(selectedPolygon.map((p) => L.latLng(p[0], p[1])));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [enabled, map, selectedPolygon]);

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
  showOnlySelected,
}) => {
  const displayPolygons = showOnlySelected
    ? selectedBuildingIndex !== null && polygons[selectedBuildingIndex]
      ? [polygons[selectedBuildingIndex]]
      : []
    : polygons;

  const selectedPolygon =
    selectedBuildingIndex !== null ? polygons[selectedBuildingIndex] : null;

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

      <FitBoundsOnSelection
        selectedPolygon={selectedPolygon}
        enabled={showOnlySelected && selectedBuildingIndex !== null}
      />

      {clickedPosition && (
        <Marker position={[clickedPosition.lat, clickedPosition.lng]} />
      )}

      {/* Render building polygons */}
      {displayPolygons.map((polygon, index) => (
        <Polygon
          key={index}
          positions={polygon}
          bubblingMouseEvents={false}
          pathOptions={{
            color:
              (showOnlySelected && selectedBuildingIndex !== null) ||
              (!showOnlySelected && index === selectedBuildingIndex)
                ? "red"
                : "blue",
            weight:
              (showOnlySelected && selectedBuildingIndex !== null) ||
              (!showOnlySelected && index === selectedBuildingIndex)
                ? 2
                : 1,
            fillOpacity:
              (showOnlySelected && selectedBuildingIndex !== null) ||
              (!showOnlySelected && index === selectedBuildingIndex)
                ? 0.55
                : 0.4,
          }}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              L.DomEvent.preventDefault(e);
              if (showOnlySelected) {
                // keep current selection when only-one is displayed
                return;
              }
              onSelectBuilding(index);
            },
          }}
        />
      ))}
    </MapContainer>
  );
};

export default MapView;
