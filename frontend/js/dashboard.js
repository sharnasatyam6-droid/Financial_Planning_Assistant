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

        const progressBar = document.querySelector("#position-progress-fill");

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

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

async function loadExpenseSummary() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/expenses/summary/${user.id}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        document.querySelector("#tracked-expenses-value").textContent =
            `₹${Number(data.total_expenses).toLocaleString("en-IN")}`;

        const count = Number(data.expense_count);

        document.querySelector("#expense-count-text").textContent =
            `${count} ${count === 1 ? "expense" : "expenses"} recorded`;

    } catch (error) {
        console.log("Unable to load expense summary.");
    }
}

loadExpenseSummary();

let spendingChart;

async function loadCategorySummary() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/expenses/category-summary/${user.id}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const categorySummary = document.querySelector("#category-summary");

        if (!data.categories || data.categories.length === 0) {
            categorySummary.innerHTML =
                "<p>No spending recorded yet.</p>";
            return;
        }

        categorySummary.innerHTML = "";

        data.categories.forEach(function(item) {
            const row = document.createElement("div");
            row.className = "category-row";

            row.innerHTML = `
                <div>
                    <span>${item.category}</span>
                </div>
                <strong>₹${Number(item.total).toLocaleString("en-IN")}</strong>
            `;

            categorySummary.appendChild(row);
        });

        const labels = data.categories.map(function(item) {
            return item.category;
        });

        const values = data.categories.map(function(item) {
            return Number(item.total);
        });

        const chart = document.querySelector("#spending-chart");

        if (spendingChart) {
            spendingChart.destroy();
        }

        spendingChart = new Chart(chart, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

    } catch (error) {
        console.log("Unable to load category summary.");
    }
}

loadCategorySummary();

async function loadRecentExpenses() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/expenses/${user.id}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const recentExpenses = document.querySelector("#recent-expenses");

        if (!data.expenses || data.expenses.length === 0) {
            recentExpenses.innerHTML =
                '<p class="empty-expenses">No expenses recorded yet.</p>';
            return;
        }

        recentExpenses.innerHTML = "";

        data.expenses.slice(0, 5).forEach(function(expense) {

            const item = document.createElement("div");
            item.className = "recent-expense-item";

            item.innerHTML = `
                <div>
                    <h3>${expense.description}</h3>
                    <p>${expense.category} • ${expense.payment_mode}</p>
                </div>

                <div class="recent-expense-right">
                    <strong>₹${Number(expense.amount).toLocaleString("en-IN")}</strong>
                    <span>${expense.expense_date}</span>
                </div>
            `;

            recentExpenses.appendChild(item);
        });

    } catch (error) {
        console.log("Unable to load recent expenses.");
    }
}

loadRecentExpenses();

const todayDate = document.querySelector("#today-date");

if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

async function loadFinancialAnalytics() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/expenses/analytics/${user.id}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const monthlySpending = Number(data.total_spending);
        const transactionCount = Number(data.transaction_count);
        const topCategory = data.top_category;
        const topCategoryAmount = Number(data.top_category_amount);

        document.querySelector("#monthly-spending-value").textContent =
            `₹${monthlySpending.toLocaleString("en-IN")}`;

        document.querySelector("#top-category-value").textContent =
            topCategory || "No data";

        document.querySelector("#top-category-amount").textContent =
            `₹${topCategoryAmount.toLocaleString("en-IN")} spent`;

        const incomeElement = document.querySelector("#income-value");
        const income = Number(
            incomeElement.textContent.replace(/[₹,]/g, "")
        );

        let spendingRate = 0;

        if (income > 0) {
            spendingRate = Math.round((monthlySpending / income) * 100);
        }

        document.querySelector("#spending-rate-value").textContent =
            `${spendingRate}%`;

        let health = "Healthy";
        let healthText = "Your spending is currently within a comfortable range.";

        if (spendingRate > 80) {
            health = "Needs Attention";
            healthText = "Your spending is taking up most of your monthly income.";
        } else if (spendingRate > 60) {
            health = "Moderate";
            healthText = "Keep an eye on your spending to protect your savings.";
        }

        document.querySelector("#financial-health-value").textContent = health;
        document.querySelector("#financial-health-text").textContent = healthText;

        let insight = "";

        if (transactionCount === 0) {
            insight = "Start recording your expenses to unlock personalized spending insights.";
        } else if (spendingRate <= 40) {
            insight = `Your recorded spending is ${spendingRate}% of your monthly income. You currently have a relatively comfortable spending level.`;
        } else if (spendingRate <= 60) {
            insight = `You have used ${spendingRate}% of your monthly income in recorded spending. Monitoring your discretionary expenses can help maintain your financial balance.`;
        } else if (spendingRate <= 80) {
            insight = `Your recorded spending has reached ${spendingRate}% of your monthly income. Consider reviewing your ${topCategory || "top spending"} expenses.`;
        } else {
            insight = `Your recorded spending is ${spendingRate}% of your monthly income. Reviewing your largest spending categories may help you protect your savings.`;
        }

        document.querySelector("#financial-insight").textContent = insight;

    } catch (error) {
        console.log("Unable to load financial analytics.");
    }
}

loadFinancialAnalytics();

let spendingTrendChart;

async function loadSpendingTrend() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch(`/expenses/monthly-trend/${user.id}`);

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const trend = data.trend.slice().reverse();

        const labels = trend.map(function(item) {
            const parts = item.month.split("-");
            const date = new Date(parts[0], Number(parts[1]) - 1);

            return date.toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric"
            });
        });

        const values = trend.map(function(item) {
            return Number(item.total);
        });

        const chart = document.querySelector("#spending-trend-chart");

        if (spendingTrendChart) {
            spendingTrendChart.destroy();
        }

        spendingTrendChart = new Chart(chart, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Monthly Spending",
                    data: values,
                    tension: 0.35,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return "₹" + Number(value).toLocaleString("en-IN");
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.log("Unable to load spending trend.");
    }
}

loadSpendingTrend();

async function loadDashboardGoal() {

    if (!user) {
        return;
    }

    try {

        const response = await fetch(`/goals/plan/${user.id}`);

        if (!response.ok) {
            return;
        }

        const plan = await response.json();

        document.querySelector("#dashboard-goal-name").textContent =
            plan.goal_name;

        document.querySelector("#dashboard-current-savings").textContent =
            `₹${Number(plan.current_savings).toLocaleString("en-IN")}`;

        document.querySelector("#dashboard-goal-target").textContent =
            `₹${Number(plan.target_amount).toLocaleString("en-IN")}`;

        document.querySelector("#dashboard-required-saving").textContent =
            `₹${Number(plan.required_monthly_saving).toLocaleString("en-IN")}`;

        document.querySelector("#dashboard-budget-left").textContent =
            `₹${Number(plan.remaining_spending_budget).toLocaleString("en-IN")}`;

        document.querySelector("#dashboard-goal-percent").textContent =
            `${plan.progress}%`;

        document.querySelector("#dashboard-goal-fill").style.width =
            `${plan.progress}%`;

        const dashboardBudgetStatus =
            document.querySelector("#dashboard-budget-status");

        dashboardBudgetStatus.textContent =
            `Budget status: ${plan.budget_status}`;

        dashboardBudgetStatus.className =
            "dashboard-budget-status " +
            plan.budget_status.toLowerCase().replace(" ", "-");

    } catch (error) {

        console.log("Unable to load dashboard goal.");

    }
}


loadDashboardGoal();

async function loadDashboardAlerts() {
    if (!user) {
        return;
    }

    try {
        const response = await fetch("/alerts/" + user.id);

        if (!response.ok) {
            throw new Error("Unable to load alerts");
        }

        const data = await response.json();
        const alerts = data.alerts || [];

        const navCount = document.querySelector("#dashboard-alert-count");
        const countValue = document.querySelector("#dashboard-alert-count-value");
        const priority = document.querySelector("#dashboard-alert-priority");
        const highlight = document.querySelector("#dashboard-signal-highlight");
        const icon = document.querySelector("#dashboard-signal-icon");
        const label = document.querySelector("#dashboard-signal-label");
        const title = document.querySelector("#dashboard-signal-title");
        const message = document.querySelector("#dashboard-signal-message");

        if (navCount) {
            navCount.textContent = alerts.length > 0 ? alerts.length : "";
        }

        if (countValue) {
            countValue.textContent = alerts.length;
        }

        if (!highlight || !icon || !label || !title || !message) {
            return;
        }

        const levelOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        const mostImportant = alerts.slice().sort(function(a, b) {
            return levelOrder[a.level] - levelOrder[b.level];
        })[0];

        highlight.className = "signal-highlight";

        if (!mostImportant) {
            icon.textContent = "✓";
            label.textContent = "ON TRACK";
            title.textContent = "Everything looks on track";
            message.textContent = "Your recorded spending is currently within the planned range.";
            if (priority) priority.textContent = "On track";
            return;
        }

        highlight.classList.add(mostImportant.level);

        const labels = {
            critical: "CRITICAL",
            warning: "NEEDS ATTENTION",
            info: "INFORMATION",
            success: "ON TRACK"
        };

        const icons = { critical: "!", warning: "!", info: "i", success: "✓" };

        icon.textContent = icons[mostImportant.level] || "i";
        label.textContent = labels[mostImportant.level] || "SIGNAL";
        title.textContent = mostImportant.title;
        message.textContent = mostImportant.message;

        if (priority) {
            priority.textContent = labels[mostImportant.level] || "Information";
        }

    } catch (error) {
        const navCount = document.querySelector("#dashboard-alert-count");
        const countValue = document.querySelector("#dashboard-alert-count-value");
        const priority = document.querySelector("#dashboard-alert-priority");

        if (navCount) navCount.textContent = "";
        if (countValue) countValue.textContent = "—";
        if (priority) priority.textContent = "Unavailable";

        console.log("Unable to load dashboard alerts.");
    }
}

loadDashboardAlerts();