const form = document.querySelector("#onboarding-form");

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const user = JSON.parse(localStorage.getItem("finoraUser"));

    if (!user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const income = Number(document.querySelector("#income").value);
    const savings = Number(document.querySelector("#savings").value);
    const fixedExpenses = Number(document.querySelector("#fixed-expenses").value);
    const priority = document.querySelector("#priority").value;

    try {
        const response = await fetch("/profile/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user.id,
                monthly_income: income,
                current_savings: savings,
                fixed_expenses: fixedExpenses,
                financial_priority: priority
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail);
            return;
        }

        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Unable to connect to the server.");
    }
});