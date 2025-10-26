import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import protomap from "./assets/protomap.json";
import routesGeoJSON from "./assets/metro_routes.json"; 
const BASE_URL = "https://svc.metrotransit.org";

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const vehicleMarkersRef = useRef({});
  const stopMarkersRef = useRef({});
  const vehiclesIntervalRef = useRef(null);
  const routeLineRef = useRef(null);

  const [routes, setRoutes] = useState([]);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Initialize MapLibre
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

  // Fetch all routes
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

  // Fetch directions when a route is expanded
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

      // Clear previous markers and route line
      Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
      vehicleMarkersRef.current = {};
      Object.values(stopMarkersRef.current).forEach((m) => m.remove());
      stopMarkersRef.current = {};

      if (routeLineRef.current && map.current.getLayer("route-line")) {
        map.current.removeLayer("route-line");
        map.current.removeSource("route-line");
        routeLineRef.current = null;
      }
    };

    fetchDirections();
  }, [expandedRouteId]);

  // Fetch vehicles every 10s for the selected route & direction
  useEffect(() => {
    if (!selectedDirection || !expandedRouteId || !map.current) return;

    const fetchVehicles = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/NexTrip/Vehicles/${expandedRouteId}?format=json`
        );
        const vehicles = await res.json();

        // Remove old vehicle markers
        Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
        vehicleMarkersRef.current = {};

        vehicles
          .filter((v) => v.direction_id === selectedDirection.direction_id)
          .forEach((bus) => {
            const lat = parseFloat(bus.latitude);
            const lng = parseFloat(bus.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              const marker = new maplibregl.Marker({ color: "red" })
                .setLngLat([lng, lat])
                .setPopup(
                  new maplibregl.Popup({ offset: 25 }).setHTML(
                    `<b>Bus ID:</b> ${bus.trip_id}<br/><b>Route:</b> ${bus.route_id}<br/><b>Direction:</b> ${bus.direction}`
                  )
                )
                .addTo(map.current);

              vehicleMarkersRef.current[bus.trip_id] = marker;
            }
          });
      } catch (err) {
        console.error(err);
      }
    };

    // Initial fetch
    fetchVehicles();

    // Clear previous interval
    if (vehiclesIntervalRef.current) clearInterval(vehiclesIntervalRef.current);

    // Set interval
    vehiclesIntervalRef.current = setInterval(fetchVehicles, 10000);

    return () => clearInterval(vehiclesIntervalRef.current);
  }, [selectedDirection, expandedRouteId]);

  // Handle direction button click
  const handleDirectionClick = async (direction) => {
    setSelectedDirection(direction);

    if (!map.current) return;

    // Clear old markers
    Object.values(vehicleMarkersRef.current).forEach((m) => m.remove());
    vehicleMarkersRef.current = {};
    Object.values(stopMarkersRef.current).forEach((m) => m.remove());
    stopMarkersRef.current = {};

    // Remove old route line
    if (routeLineRef.current && map.current.getLayer("route-line")) {
      map.current.removeLayer("route-line");
      map.current.removeSource("route-line");
      routeLineRef.current = null;
    }

    try {
      // Fetch stops for this route + direction
      const stopsRes = await fetch(
        `${BASE_URL}/NexTrip/Stops/${expandedRouteId}/${direction.direction_id}?format=json`
      );
      const stops = await stopsRes.json();

      for (const stop of stops) {
        // Get stop details with coordinates
        const stopDetailRes = await fetch(
          `${BASE_URL}/NexTrip/${expandedRouteId}/${direction.direction_id}/${stop.place_code}?format=json`
        );
        const stopDetail = await stopDetailRes.json();
        const stopData = stopDetail.stops[0];

        if (stopData && stopData.latitude && stopData.longitude) {
          // Custom div for stop marker
          const el = document.createElement("div");
          el.style.width = "12px";
          el.style.height = "12px";
          el.style.border = "2px solid white";
          el.style.borderRadius = "50%";
          el.style.backgroundColor = "blue";
          el.style.boxShadow = "0 0 2px rgba(0,0,0,0.5)";

          // Build departures HTML
          let departuresHtml = "";
          if (stopDetail.departures && stopDetail.departures.length > 0) {
            departuresHtml = "<ul style='padding-left:15px;margin:0;'>";
            stopDetail.departures.slice(0, 5).forEach((dep) => {
              departuresHtml += `<li>${dep.departure_text} → ${dep.description}</li>`;
            });
            departuresHtml += "</ul>";
          } else {
            departuresHtml = "<i>No upcoming departures</i>";
          }

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([stopData.longitude, stopData.latitude])
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(
                `<b>Stop:</b> ${stopData.description}<br/><b>Next departures:</b>${departuresHtml}`
              )
            )
            .addTo(map.current);

          stopMarkersRef.current[stopData.place_code] = marker;
        }
      }

      // Show route geometry
      const routeGeo = routesGeoJSON.features.find(
        (r) => r.properties.route_id === expandedRouteId
      );
      if (routeGeo && routeGeo.geometry) {
        map.current.addSource("route-line", {
          type: "geojson",
          data: routeGeo,
        });

        map.current.addLayer({
          id: "route-line",
          type: "line",
          source: "route-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#FF0000", "line-width": 4, "line-opacity": 0.8 },
        });

        routeLineRef.current = "route-line";

        // Fit map to route
        const bounds = new maplibregl.LngLatBounds();
        routeGeo.geometry.coordinates.forEach((coord) => bounds.extend(coord));
        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (err) {
      console.error("Error fetching stops or route:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "300px",
          padding: "10px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
        }}
      >
        <h2>Metro Transit Routes</h2>
        {loadingRoutes ? (
          <p>Loading routes...</p>
        ) : (
          routes.map((route) => (
            <div key={route.route_id} style={{ marginBottom: "5px" }}>
              {/* Route Button */}
              <button
                onClick={() =>
                  setExpandedRouteId(
                    expandedRouteId === route.route_id ? null : route.route_id
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background:
                    expandedRouteId === route.route_id ? "#007bff" : "#eee",
                  color: expandedRouteId === route.route_id ? "#fff" : "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {route.route_label}
              </button>

              {/* Direction buttons */}
              {expandedRouteId === route.route_id && directions.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginTop: "5px",
                    paddingLeft: "10px",
                  }}
                >
                  {directions.map((dir) => (
                    <button
                      key={dir.direction_id}
                      onClick={() => handleDirectionClick(dir)}
                      style={{
                        marginTop: "3px",
                        padding: "6px",
                        background:
                          selectedDirection?.direction_id === dir.direction_id
                            ? "#28a745"
                            : "#ddd",
                        color:
                          selectedDirection?.direction_id === dir.direction_id
                            ? "#fff"
                            : "#000",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {dir.direction_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Map */}
      <div
        ref={mapContainer}
        style={{ flex: 1, width: "100%", height: "100%" }}
      ></div>
    </div>
  );
}















