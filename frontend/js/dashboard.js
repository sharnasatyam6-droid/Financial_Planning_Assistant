const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}

const profileName = document.querySelector("#profile-name");
const profileAvatar = document.querySelector("#profile-avatar");
const welcomeTitle = document.querySelector("#welcome-title");

if (user) {
    const firstName = user.name.split(" ")[0];

    profileName.textContent = user.name;
    profileAvatar.textContent = firstName.charAt(0).toUpperCase();

    const hour = new Date().getHours();

    if (hour < 12) {
        welcomeTitle.textContent = `Good morning, ${firstName}`;
    } else if (hour < 18) {
        welcomeTitle.textContent = `Good afternoon, ${firstName}`;
    } else {
        welcomeTitle.textContent = `Good evening, ${firstName}`;
    }
}

async function loadProfile() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/profile/${user.id}`);

        if (!response.ok) {
            return;
        }

        const profile = await response.json();

        const income = Number(profile.monthly_income);
        const savings = Number(profile.current_savings);
        const fixedExpenses = Number(profile.fixed_expenses);
        const available = income - fixedExpenses;

        document.querySelector("#income-value").textContent =
            `₹${income.toLocaleString("en-IN")}`;

        document.querySelector("#expenses-value").textContent =
            `₹${fixedExpenses.toLocaleString("en-IN")}`;

        document.querySelector("#savings-value").textContent =
            `₹${savings.toLocaleString("en-IN")}`;

        document.querySelector("#available-value").textContent =
            `₹${available.toLocaleString("en-IN")}`;

        document.querySelector("#position-income").textContent =
            `₹${income.toLocaleString("en-IN")}`;

        document.querySelector("#position-expenses").textContent =
            `₹${fixedExpenses.toLocaleString("en-IN")}`;

        document.querySelector("#position-remaining").textContent =
            `₹${available.toLocaleString("en-IN")}`;

        const percentage = income > 0
            ? Math.max(0, Math.min(100, Math.round((available / income) * 100)))
            : 0;

        document.querySelector("#remaining-percent").textContent =
            `${percentage}%`;

        const priorityNames = {
            saving: "Increase Savings",
            expenses: "Control Expenses",
            goal: "Achieve a Specific Goal",
            balance: "Balance Spending & Saving"
        };

        const priorityText = {
            saving: "Finora will focus on helping you understand how much you can put aside each month.",
            expenses: "Finora will focus on understanding your spending and identifying areas to control.",
            goal: "Finora will focus on connecting your spending with a specific financial target.",
            balance: "Finora will focus on maintaining a healthier balance between spending and saving."
        };

        const priority = profile.financial_priority;

        document.querySelector("#priority-title").textContent =
            priorityNames[priority] || "Financial planning";

        document.querySelector("#priority-heading").textContent =
            priorityNames[priority] || "Build a stronger financial plan";

        document.querySelector("#priority-text").textContent =
            priorityText[priority] || "Your financial priority will help Finora personalize future recommendations.";

    } catch (error) {
        console.log("Unable to load financial profile.");
    }
}

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

loadProfile();