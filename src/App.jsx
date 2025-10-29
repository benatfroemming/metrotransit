import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import protomap from "./assets/protomap.json";
import routesGeoJSON from "./assets/metro_routes.json";
import Sidebar from "./components/Sidebar";
import StopPopup from "./components/StopPopup";

const BASE_URL = "https://svc.metrotransit.org";

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarkersRef = useRef([]);
  const stopMarkersRef = useRef([]);
  const vehiclesIntervalRef = useRef(null);
  const routeLineRef = useRef(null);

  const [routes, setRoutes] = useState([]);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: protomap,
      center: [-93.265, 44.9778],
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => map.current.remove();
  }, []);

  // Fetch routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch(`${BASE_URL}/NexTrip/Routes?format=json`);
        const data = await res.json();
        setRoutes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, []);

  // Fetch directions
  useEffect(() => {
    if (!expandedRouteId) return;

    setDirections([]);
    setSelectedDirection(null);

    const fetchDirections = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/NexTrip/Directions/${expandedRouteId}?format=json`
        );
        const data = await res.json();
        setDirections(data);
      } catch (err) {
        console.error(err);
      }

      // clear old map data
      clearAllMapElements();
    };

    fetchDirections();
  }, [expandedRouteId]);

  // Vehicles refresh
  useEffect(() => {
    if (!selectedDirection || !expandedRouteId || !map.current) return;

    const fetchVehicles = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/NexTrip/Vehicles/${expandedRouteId}?format=json`
        );
        const vehicles = await res.json();

        // clear old vehicle markers
        Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
        vehicleMarkersRef.current = {};

        vehicles
          .filter((v) => v.direction_id === selectedDirection.direction_id)
          .forEach((bus) => {
            const lat = parseFloat(bus.latitude);
            const lng = parseFloat(bus.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              const el = document.createElement("div");
              el.className = 'marker-bus';
              el.style.width = "32px";
              el.style.height = "32px";
              el.style.backgroundColor = "#007bff";
              el.style.border = "2px solid white";
              el.style.borderRadius = "50%";
              el.style.display = "flex";
              el.style.alignItems = "center";
              el.style.justifyContent = "center";
              el.style.boxShadow = "0 0 3px rgba(0,0,0,0.5)";
              el.style.color = "white";
              el.style.fontSize = "18px";
              el.style.fontWeight = "bold";
              el.style.cursor = "pointer";
              el.style.userSelect = "none";
              el.textContent = "🚌";
              el.style.zIndex = "2";

              const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
                `<b>Bus ID:</b> ${bus.trip_id}<br/><b>Route:</b> ${bus.route_id}<br/><b>Direction:</b> ${bus.direction}`
              );

              popup.on('open', () => {
                const popupEl = popup.getElement();
                if (popupEl) {
                  popupEl.style.zIndex = '10';
                }
              });

              const marker = new maplibregl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map.current);

              vehicleMarkersRef.current[bus.trip_id] = marker;
            }
          });
      } catch (err) {
        console.error(err);
      }
    };

    fetchVehicles();
    if (vehiclesIntervalRef.current) clearInterval(vehiclesIntervalRef.current);
    vehiclesIntervalRef.current = setInterval(fetchVehicles, 10000);

    return () => clearInterval(vehiclesIntervalRef.current);
  }, [selectedDirection, expandedRouteId]);

  // helper
  const clearAllMapElements = () => {
    Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
    vehicleMarkersRef.current = {};
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];
    if (routeLineRef.current && map.current.getLayer("route-line")) {
      map.current.removeLayer("route-line");
      map.current.removeSource("route-line");
      routeLineRef.current = null;
    }
  };

  // when direction selected
  const handleDirectionClick = async (direction) => {
    setSelectedDirection(direction);
    if (!map.current) return;

    clearAllMapElements();

    const routeGeo = routesGeoJSON.features.find(
      (r) => r.properties.route_id === expandedRouteId
    );

    if (routeGeo && routeGeo.geometry) {
      map.current.addSource("route-line", { type: "geojson", data: routeGeo });
      map.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "red", "line-width": 4, "line-opacity": 0.8 },
      });
      routeLineRef.current = "route-line";

      const bounds = new maplibregl.LngLatBounds();
      routeGeo.geometry.coordinates.forEach((coord) => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // fetch stops
    try {
      const stopsRes = await fetch(
        `${BASE_URL}/NexTrip/Stops/${expandedRouteId}/${direction.direction_id}?format=json`
      );
      const stops = await stopsRes.json();

      for (const stop of stops) {
        const stopDetailRes = await fetch(
          `${BASE_URL}/NexTrip/${expandedRouteId}/${direction.direction_id}/${stop.place_code}?format=json`
        );
        const stopDetail = await stopDetailRes.json();
        const stopData = stopDetail.stops[0];
        if (stopData && stopData.latitude && stopData.longitude) {
          const popupHTML = StopPopup({ stopData, stopDetail });

          const el = document.createElement("div");
          el.className = 'marker-stop';
          el.style.width = "12px";
          el.style.height = "12px";
          el.style.border = "2px solid white";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = "red";
          el.style.boxShadow = "0 0 2px rgba(0,0,0,0.5)";
          el.style.zIndex = "1";

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML);
          
          popup.on('open', () => {
            const popupEl = popup.getElement();
            if (popupEl) {
              popupEl.style.zIndex = '10';
            }
          });

          const marker = new maplibregl.Marker({ color: "#007bffff", element: el })
            .setLngLat([stopData.longitude, stopData.latitude])
            .setPopup(popup)
            .addTo(map.current);

          stopMarkersRef.current.push(marker);
        }
      }
    } catch (err) {
      console.error("Error fetching stops:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        routes={routes}
        loadingRoutes={loadingRoutes}
        expandedRouteId={expandedRouteId}
        setExpandedRouteId={setExpandedRouteId}
        directions={directions}
        selectedDirection={selectedDirection}
        onDirectionClick={handleDirectionClick}
      />
      <div ref={mapContainer} style={{ flex: 1, width: "100%", height: "100%" }} />
    </div>
  );
}















