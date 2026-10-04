const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}

document.querySelector("#profile-name").textContent = user.name;
document.querySelector("#profile-avatar").textContent = user.name.charAt(0).toUpperCase();
document.querySelector("#today-date").textContent = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
});

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function getInsightClass(type) {
    return {
        warning: "insight-warning",
        positive: "insight-positive",
        focus: "insight-focus",
        info: "insight-info"
    }[type] || "insight-info";
}

function getInsightIcon(type) {
    return {
        warning: "!",
        positive: "✓",
        focus: "◆",
        info: "i"
    }[type] || "i";
}

async function loadInsights() {
    try {
        const response = await fetch("/insights/" + user.id);

        if (!response.ok) {
            throw new Error("Unable to load insights");
        }

        const data = await response.json();

        document.querySelector("#financial-score").textContent = data.financial_score;
        document.querySelector("#financial-score-fill").style.width = data.financial_score + "%";
        document.querySelector("#insight-health").textContent = data.health;
        document.querySelector("#health-text").textContent = data.health_text;
        document.querySelector("#insight-income").textContent = formatMoney(data.monthly_income);
        document.querySelector("#insight-spending").textContent = formatMoney(data.monthly_spending);
        document.querySelector("#insight-rate").textContent = data.spending_rate + "%";
        document.querySelector("#insight-capacity").textContent = formatMoney(data.savings_capacity);

        const list = document.querySelector("#insights-list");
        list.innerHTML = "";

        data.insights.forEach(function(insight) {
            const item = document.createElement("article");
            item.className = "intelligence-insight " + getInsightClass(insight.type);

            item.innerHTML =
                '<div class="intelligence-insight-icon">' + getInsightIcon(insight.type) + '</div>' +
                '<div><span class="intelligence-insight-type">' + insight.type.toUpperCase() + '</span>' +
                '<h3>' + insight.title + '</h3><p>' + insight.message + '</p></div>';

            list.appendChild(item);
        });
    } catch (error) {
        document.querySelector("#insights-list").innerHTML =
            '<div class="insight-error"><strong>Unable to load insights</strong><p>Make sure the Finora server is running and try again.</p></div>';
    }
}

document.querySelector("#logout-button").addEventListener("click", function() {
    localStorage.removeItem("finoraUser");
    window.location.href = "login.html";
});

loadInsights();