const user = JSON.parse(localStorage.getItem("finoraUser"));

if (!user) {
    window.location.href = "login.html";
}

const form = document.querySelector("#expense-form");
const paymentMode = document.querySelector("#payment-mode");
const transactionGroup = document.querySelector("#transaction-group");
const transactionInput = document.querySelector("#transaction-id");
const expenseDate = document.querySelector("#expense-date");
const expenseList = document.querySelector("#expense-list");

const today = new Date().toISOString().split("T")[0];
expenseDate.value = today;

document.querySelector("#profile-name").textContent = user.name;
document.querySelector("#profile-avatar").textContent =
    user.name.charAt(0).toUpperCase();

paymentMode.addEventListener("change", function() {
    if (paymentMode.value === "online") {
        transactionGroup.style.display = "block";
        transactionInput.required = true;
    } else {
        transactionGroup.style.display = "none";
        transactionInput.required = false;
        transactionInput.value = "";
    }
});

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const expense = {
        user_id: user.id,
        amount: Number(document.querySelector("#amount").value),
        category: document.querySelector("#category").value,
        description: document.querySelector("#description").value.trim(),
        payment_mode: paymentMode.value,
        transaction_id: transactionInput.value.trim(),
        expense_date: expenseDate.value
    };

    try {
        const response = await fetch("/expenses/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(expense)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail);
            return;
        }

        alert("Expense added successfully!");

        form.reset();
        expenseDate.value = today;
        transactionGroup.style.display = "none";
        transactionInput.required = false;

        loadExpenses();

    } catch (error) {
        alert("Unable to connect to the server.");
    }
});

async function loadExpenses() {
    try {
        const response = await fetch(`/expenses/${user.id}`);
        const data = await response.json();

        if (!data.expenses || data.expenses.length === 0) {
            expenseList.innerHTML =
                '<p class="empty-expenses">No expenses recorded yet.</p>';
            return;
        }

        expenseList.innerHTML = "";

        data.expenses.forEach(function(expense) {
            const item = document.createElement("div");
            item.className = "expense-item";

            item.innerHTML = `
                <div>
                    <h3>${expense.description}</h3>
                    <p>${expense.category} • ${expense.payment_mode}</p>
                    <span>${expense.expense_date}</span>
                </div>
                <strong>₹${Number(expense.amount).toLocaleString("en-IN")}</strong>
            `;

            expenseList.appendChild(item);
        });

    } catch (error) {
        expenseList.innerHTML =
            '<p class="empty-expenses">Unable to load expenses.</p>';
    }
}

document.querySelector("#logout-button").addEventListener("click", function() {
    localStorage.removeItem("finoraUser");
    window.location.href = "login.html";
});

loadExpenses();