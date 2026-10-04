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

async function runSimulation() {
    const reduction = Number(document.querySelector("#spending-reduction").value) || 0;
    const extraSaving = Number(document.querySelector("#extra-saving").value) || 0;
    const status = document.querySelector("#simulation-status");
    const result = document.querySelector("#simulation-result");

    if (reduction < 0 || extraSaving < 0) {
        status.textContent = "Enter values of 0 or more.";
        return;
    }

    status.textContent = "Calculating your scenario...";
    result.classList.remove("ready");

    try {
        const response = await fetch("/insights/simulate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                monthly_reduction: reduction,
                extra_monthly_saving: extraSaving
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Simulation failed");
        }

        document.querySelector("#simulation-improvement").textContent =
            "+" + formatMoney(data.monthly_improvement) + " / month";

        document.querySelector("#simulation-spending").textContent =
            formatMoney(data.projected_spending);

        document.querySelector("#simulation-capacity").textContent =
            formatMoney(data.projected_capacity);

        document.querySelector("#simulation-rate").textContent =
            data.projected_spending_rate + "%";

        const goalLabel = document.querySelector("#simulation-goal-label");
        const goalValue = document.querySelector("#simulation-goal");

        if (data.goal_months === null) {
            goalLabel.textContent = "Goal timeline";
            goalValue.textContent = "Set a goal";
        } else if (data.goal_months === 0) {
            goalLabel.textContent = data.goal_name;
            goalValue.textContent = "Reached";
        } else {
            goalLabel.textContent = data.goal_name;
            goalValue.textContent =
                data.goal_months + (data.goal_months === 1 ? " month" : " months");
        }

        const improvement = Number(data.monthly_improvement);

        if (improvement > 0) {
            document.querySelector("#simulation-message").textContent =
                "This scenario creates " + formatMoney(improvement) +
                " more monthly capacity based on your current recorded activity.";
        } else {
            document.querySelector("#simulation-message").textContent =
                "This scenario does not increase monthly capacity yet. Try reducing spending or adding planned saving.";
        }

        status.textContent = "Projection updated from your current recorded numbers.";
        result.classList.add("ready");

    } catch (error) {
        status.textContent = error.message || "Unable to run the simulation.";
    }
}

document.querySelector("#run-simulation").addEventListener("click", runSimulation);

document.querySelector("#logout-button").addEventListener("click", function() {
    localStorage.removeItem("finoraUser");
    window.location.href = "login.html";
});

document.querySelectorAll(".coming-link").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        alert("This feature will be available in the next prototype version.");
    });
});

loadInsights();