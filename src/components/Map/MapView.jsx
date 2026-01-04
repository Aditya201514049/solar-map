import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [clickedPosition, setClickedPosition] = useState(null);

  useEffect(() => {
    // Initialize map only once
    mapRef.current = L.map("map").setView([23.8103, 90.4125], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapRef.current);

    // Map click handler
    mapRef.current.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setClickedPosition({ lat, lng });
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  // Handle marker updates
  useEffect(() => {
    if (!clickedPosition || !mapRef.current) return;

    const { lat, lng } = clickedPosition;

    // If marker exists, move it
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      // Create marker first time
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }

    // Optional: center map on marker
    mapRef.current.flyTo([lat, lng], mapRef.current.getZoom());
  }, [clickedPosition]);

  return (
    <div
      id="map"
      style={{ height: "100%", width: "100%" }}
    />
  );
};

export default MapView;
