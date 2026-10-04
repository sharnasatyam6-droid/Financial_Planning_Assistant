const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}


document.querySelector("#profile-name").textContent = user.name;

document.querySelector("#profile-avatar").textContent =
    user.name.charAt(0).toUpperCase();


document.querySelector("#today-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });


const alertsContainer =
    document.querySelector("#alerts-container");

const alertCount =
    document.querySelector("#alert-count");

const navAlertCount =
    document.querySelector("#nav-alert-count");


function getAlertIcon(level) {

    if (level === "critical") {
        return "!";
    }

    if (level === "warning") {
        return "!";
    }

    if (level === "info") {
        return "i";
    }

    return "✓";
}


function getAlertLabel(level) {

    if (level === "critical") {
        return "Critical";
    }

    if (level === "warning") {
        return "Needs attention";
    }

    if (level === "info") {
        return "Information";
    }

    return "On track";
}


function showAlerts(alerts) {

    alertCount.textContent = alerts.length;

    if (alerts.length > 0) {
        navAlertCount.textContent = alerts.length;
    } else {
        navAlertCount.textContent = "";
    }


    alertsContainer.innerHTML = "";


    alerts.forEach(function(alert) {

        const alertItem = document.createElement("div");

        alertItem.className =
            `financial-alert ${alert.level}`;


        alertItem.innerHTML = `

            <div class="financial-alert-icon">
                ${getAlertIcon(alert.level)}
            </div>

            <div class="financial-alert-content">

                <div class="financial-alert-top">

                    <span class="financial-alert-level">
                        ${getAlertLabel(alert.level)}
                    </span>

                </div>

                <h3>${alert.title}</h3>

                <p>${alert.message}</p>

            </div>

        `;


        alertsContainer.appendChild(alertItem);

    });

}


async function loadAlerts() {

    alertsContainer.innerHTML = `
        <div class="alerts-loading">
            Checking your financial activity...
        </div>
    `;


    try {

        const response =
            await fetch(`/alerts/${user.id}`);


        if (!response.ok) {

            throw new Error("Unable to load alerts");

        }


        const data = await response.json();

        showAlerts(data.alerts);


    } catch (error) {

        alertCount.textContent = "—";

        navAlertCount.textContent = "";

        alertsContainer.innerHTML = `
            <div class="alerts-error">
                <strong>Unable to load alerts</strong>
                <p>
                    We could not connect to the alert engine.
                    Please make sure the server is running and try again.
                </p>
            </div>
        `;

    }

}


document.querySelector("#refresh-alerts").addEventListener(
    "click",
    loadAlerts
);


document.querySelector("#logout-button").addEventListener(
    "click",
    function() {

        localStorage.removeItem("finoraUser");

        window.location.href = "login.html";

    }
);


loadAlerts();