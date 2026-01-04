import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {
  useEffect(() => {
    const map = L.map("map").setView([23.8103, 90.4125], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
};

export default MapView;
