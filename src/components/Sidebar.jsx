import { useState } from "react";

export default function Sidebar({
    routes,
    loadingRoutes,
    expandedRouteId,
    setExpandedRouteId,
    directions,
    selectedDirection,
    onDirectionClick,
    }) {
    const [isOpen, setIsOpen] = useState(true);

    const sidebarStyle = {
        width: "300px",
        padding: "10px",
        borderRight: "1px solid #ccc",
        overflowY: "auto",
        transition: "transform 0.3s ease",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: "#fff",
        zIndex: 1000,
    };

    const toggleButtonStyle = {
        position: "fixed",
        top: "50%",
        left: isOpen ? "320px" : "0px", 
        transform: "translateY(-50%)",
        zIndex: 1100,
        padding: "6px 10px",
        cursor: "pointer",
        backgroundColor: "#666666ff",
        color: "#fff",
        border: "none",
        borderRadius: "2%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        transition: "left 0.3s ease",
    };

    return (
        <>
        <div style={sidebarStyle}>
            <h2>Metro Transit Routes</h2>
            {loadingRoutes ? (
            <p>Loading routes...</p>
            ) : (
            routes.map((route) => (
                <div key={route.route_id} style={{ marginBottom: "5px" }}>
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
                        onClick={() => onDirectionClick(dir)}
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

        {/* Toggle button arrow */}
        <button
            style={toggleButtonStyle}
            onClick={() => setIsOpen(!isOpen)}
        >
            {isOpen ? "❮" : "❯"}
        </button>
        </>
    );
}


