export default function StopPopup({ stopData, stopDetail }) {
    const departures =
        stopDetail.departures && stopDetail.departures.length > 0
        ? `<ul style="
                padding-left: 0;
                margin: 5px 0 0 0;
                list-style: none;
                font-size: 14px;
            ">
            ${stopDetail.departures
                .slice(0, 5)
                .map((dep, idx) => {
                // Alternate row colors for nicer look
                const bgColor = idx % 2 === 0 ? "#f0f0f0" : "#e0e0e0";

                // Show Wi-Fi icon if departure_text contains "Min"
                const wifiIcon = dep.departure_text.includes("Min")
                    ? "&#128246;" 
                    : "";

                return `
                    <li style="
                    margin-bottom: 3px;
                    padding: 4px 6px;
                    background-color: ${bgColor};
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    ">
                    <span>${dep.departure_text}</span>
                    <span style="margin-left: 6px;">${wifiIcon}</span>
                    </li>
                `;
                })
                .join("")}
            </ul>`
        : "<i style='font-size:14px'>No upcoming departures</i>";

    return `
        <div style="
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 1.3;
        min-width: 200px;
        max-width: 350px;
        display: flex;
        flex-direction: column;
        word-wrap: break-word;
        ">
        <div style="font-weight: bold; margin-bottom: 5px; word-break: break-word;">
            Stop: ${stopData.description}
        </div>
        <div style="font-weight: bold; margin-bottom: 5px;">Next departures:</div>
        ${departures}
        </div>
    `;
}




