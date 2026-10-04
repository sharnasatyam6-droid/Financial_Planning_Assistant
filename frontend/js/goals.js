const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}

const profileName = document.querySelector("#profile-name");
const profileAvatar = document.querySelector("#profile-avatar");

profileName.textContent = user.name;
profileAvatar.textContent =
    user.name.charAt(0).toUpperCase();


let profileData = null;


function formatMoney(amount) {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
}


async function loadProfile() {

    try {

        const response = await fetch(`/profile/${user.id}`);

        if (!response.ok) {
            return;
        }

        profileData = await response.json();

        document.querySelector("#goal-income").textContent =
            formatMoney(profileData.monthly_income);

        document.querySelector("#goal-fixed-expenses").textContent =
            formatMoney(profileData.fixed_expenses);

        const available =
            Number(profileData.monthly_income) -
            Number(profileData.fixed_expenses);

        document.querySelector("#goal-available").textContent =
            formatMoney(Math.max(0, available));

    } catch (error) {

        console.log("Unable to load financial profile.");

    }
}


async function loadGoal() {

    try {

        const response = await fetch(`/goals/${user.id}`);

        if (!response.ok) {
            return;
        }

        const goal = await response.json();

        document.querySelector("#goal-name").value =
            goal.goal_name;

        document.querySelector("#target-amount").value =
            goal.target_amount;

        document.querySelector("#target-date").value =
            goal.target_date;

        document.querySelector("#progress-goal-name").textContent =
            goal.goal_name;

    } catch (error) {

        console.log("No savings goal found.");

    }
}


function calculateBudget(plan) {

    document.querySelector("#goal-income").textContent =
        formatMoney(plan.monthly_income);

    document.querySelector("#goal-fixed-expenses").textContent =
        formatMoney(plan.fixed_expenses);

    document.querySelector("#goal-available").textContent =
        formatMoney(plan.available_after_fixed);

    document.querySelector("#required-saving").textContent =
        formatMoney(plan.required_monthly_saving);

    document.querySelector("#spending-budget").textContent =
        formatMoney(plan.suggested_spending_budget);

    document.querySelector("#goal-summary-title").textContent =
        plan.goal_name;

    document.querySelector("#goal-summary-text").textContent =
        `You need to save approximately ${formatMoney(plan.required_monthly_saving)} per month to reach this goal by ${plan.target_date}.`;

    document.querySelector("#progress-goal-name").textContent =
        plan.goal_name;

    document.querySelector("#progress-current-savings").textContent =
        formatMoney(plan.current_savings);

    document.querySelector("#progress-target").textContent =
        formatMoney(plan.target_amount);

    document.querySelector("#goal-progress-percent").textContent =
        `${plan.progress}%`;

    document.querySelector("#goal-progress-fill").style.width =
        `${plan.progress}%`;

    document.querySelector("#monthly-spending").textContent =
        formatMoney(plan.monthly_spending);

    document.querySelector("#remaining-budget").textContent =
        formatMoney(plan.remaining_spending_budget);

    const budgetStatus = document.querySelector("#goal-budget-status");

    budgetStatus.textContent =
        `Budget status: ${plan.budget_status}`;

    budgetStatus.className =
        "goal-budget-status " +
        plan.budget_status.toLowerCase().replace(" ", "-");
}

async function loadGoalPlan() {

    try {

        const response = await fetch(`/goals/plan/${user.id}`);

        if (!response.ok) {
            return;
        }

        const plan = await response.json();

        calculateBudget(plan);

    } catch (error) {

        console.log("Unable to load goal plan.");

    }
}

document.querySelector("#goal-form").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const goal = {
            user_id: user.id,
            goal_name: document.querySelector("#goal-name").value.trim(),
            target_amount: Number(
                document.querySelector("#target-amount").value
            ),
            target_date: document.querySelector("#target-date").value
        };

        try {

            const response = await fetch("/goals/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(goal)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail);
                return;
            }

            alert("Savings goal saved successfully!");

            await loadGoalPlan();

        } catch (error) {

            alert("Unable to connect to the server.");

        }
    }
);


document.querySelector("#logout-button").addEventListener(
    "click",
    function() {

        localStorage.removeItem("finoraUser");
        window.location.href = "login.html";

    }
);

loadProfile();
loadGoal();
loadGoalPlan();