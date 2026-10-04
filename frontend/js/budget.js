const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}

const profileName = document.querySelector("#profile-name");
const profileAvatar = document.querySelector("#profile-avatar");

profileName.textContent = user.name;
profileAvatar.textContent = user.name.charAt(0).toUpperCase();

function formatMoney(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function showPlan(plan) {
    document.querySelector("#budget-available").textContent =
        formatMoney(plan.suggested_spending_budget);

    document.querySelector("#budget-income").textContent =
        formatMoney(plan.monthly_income);

    document.querySelector("#budget-fixed").textContent =
        formatMoney(plan.fixed_expenses);

    document.querySelector("#budget-saving").textContent =
        formatMoney(plan.required_monthly_saving);

    document.querySelector("#budget-planned").textContent =
        formatMoney(plan.suggested_spending_budget);

    document.querySelector("#budget-spent").textContent =
        formatMoney(plan.monthly_spending);

    document.querySelector("#budget-remaining").textContent =
        formatMoney(plan.remaining_spending_budget);

    document.querySelector("#budget-used-percent").textContent =
        `${plan.budget_used_percent}%`;

    document.querySelector("#budget-progress-fill").style.width =
        `${Math.min(100, plan.budget_used_percent)}%`;

    document.querySelector("#budget-progress-text").textContent =
        `${plan.budget_used_percent}% of your planned budget used.`;

    document.querySelector("#budget-status-text").textContent =
        `Budget status: ${plan.budget_status}. You have ${formatMoney(plan.remaining_spending_budget)} left for this month.`;

    document.querySelector("#budget-goal-name").textContent =
        plan.goal_name;

    document.querySelector("#budget-target").textContent =
        formatMoney(plan.target_amount);

    document.querySelector("#budget-target-date").textContent =
        formatDate(plan.target_date);

    document.querySelector("#budget-monthly-saving").textContent =
        formatMoney(plan.required_monthly_saving);

    document.querySelector("#budget-goal-progress").textContent =
        `${plan.progress}%`;
}

async function loadBudget() {
    try {
        const response = await fetch(`/goals/plan/${user.id}`);

        if (!response.ok) {
            const data = await response.json();
            document.querySelector("#budget-status-text").textContent =
                data.detail || "Create a savings goal to generate your budget.";
            return;
        }

        const plan = await response.json();
        showPlan(plan);
    } catch (error) {
        document.querySelector("#budget-status-text").textContent =
            "Unable to load your budget right now.";
    }
}

document.querySelector("#logout-button").addEventListener("click", function() {
    localStorage.removeItem("finoraUser");
    window.location.href = "login.html";
});

loadBudget();