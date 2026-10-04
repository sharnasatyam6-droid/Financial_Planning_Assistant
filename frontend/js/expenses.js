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

const statementFile = document.querySelector("#statement-file");
const importButton = document.querySelector("#import-button");
const importFileName = document.querySelector("#import-file-name");
const importStatus = document.querySelector("#import-status");

statementFile.addEventListener("change", function() {
    if (statementFile.files.length) {
        importFileName.textContent = statementFile.files[0].name;
        importStatus.textContent = "";
    }
});

function splitCsvLine(line) {
    const values = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            quoted = !quoted;
        } else if (char === "," && !quoted) {
            values.push(value.trim());
            value = "";
        } else {
            value += char;
        }
    }

    values.push(value.trim());
    return values.map(function(item) {
        return item.replace(/^"|"$/g, "");
    });
}

function findColumn(headers, names) {
    return headers.findIndex(function(header) {
        return names.includes(header.toLowerCase().replace(/[^a-z0-9]/g, ""));
    });
}

function guessCategory(description) {
    const text = description.toLowerCase();

    if (/food|restaurant|swiggy|zomato|cafe|grocery|mart/.test(text)) return "Food";
    if (/uber|ola|metro|bus|fuel|petrol|transport/.test(text)) return "Transport";
    if (/school|college|course|book|education|fee/.test(text)) return "Education";
    if (/amazon|flipkart|shopping|myntra|mall/.test(text)) return "Shopping";
    if (/bill|electric|recharge|rent|internet|mobile/.test(text)) return "Bills";
    if (/movie|cinema|game|netflix|spotify|entertainment/.test(text)) return "Entertainment";
    if (/hospital|medical|pharmacy|medicine|health/.test(text)) return "Health";

    return "Other";
}

function normalizeDate(value) {
    const text = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const parts = text.split(/[/-]/);

    if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];

        if (year.length === 2) {
            year = "20" + year;
        }

        if (day.length === 1) day = "0" + day;
        if (month.length === 1) month = "0" + month;

        return year + "-" + month + "-" + day;
    }

    return "";
}

importButton.addEventListener("click", function() {
    if (!statementFile.files.length) {
        importStatus.textContent = "Choose a CSV file first.";
        return;
    }

    const file = statementFile.files[0];
    const reader = new FileReader();

    importStatus.textContent = "Reading statement...";

    reader.onload = async function(event) {
        const lines = event.target.result
            .split(/\r?\n/)
            .filter(function(line) {
                return line.trim();
            });

        if (lines.length < 2) {
            importStatus.textContent = "The CSV does not contain enough data.";
            return;
        }

        const headers = splitCsvLine(lines[0]).map(function(header) {
            return header.toLowerCase().replace(/[^a-z0-9]/g, "");
        });

        const dateIndex = findColumn(headers, ["date", "transactiondate", "valuedate"]);
        const amountIndex = findColumn(headers, ["amount", "transactionamount", "debit", "withdrawal"]);
        const descriptionIndex = findColumn(headers, ["description", "narration", "details", "merchant"]);
        const categoryIndex = findColumn(headers, ["category", "expensecategory"]);
        const modeIndex = findColumn(headers, ["paymentmode", "mode", "type"]);
        const transactionIndex = findColumn(headers, ["transactionid", "transactionreference", "reference", "ref"]);

        if (dateIndex === -1 || amountIndex === -1 || descriptionIndex === -1) {
            importStatus.textContent = "CSV needs date, amount and description columns.";
            return;
        }

        const imported = [];

        for (let i = 1; i < lines.length; i++) {
            const row = splitCsvLine(lines[i]);

            if (row.length <= Math.max(dateIndex, amountIndex, descriptionIndex)) {
                continue;
            }

            const amountText = row[amountIndex].replace(/[^0-9.-]/g, "");
            const amount = Number(amountText);
            const description = row[descriptionIndex].trim();
            const expenseDate = normalizeDate(row[dateIndex]);

            if (!amount || amount <= 0 || !description || !expenseDate) {
                continue;
            }

            let paymentMode = modeIndex >= 0 ? row[modeIndex].toLowerCase() : "online";

            if (!paymentMode.includes("cash")) {
                paymentMode = "online";
            } else {
                paymentMode = "cash";
            }

            imported.push({
                user_id: user.id,
                amount: amount,
                category: categoryIndex >= 0 && row[categoryIndex].trim()
                    ? row[categoryIndex].trim()
                    : guessCategory(description),
                description: description,
                payment_mode: paymentMode,
                transaction_id: transactionIndex >= 0
                    ? row[transactionIndex].trim()
                    : "import-" + Date.now() + "-" + i,
                expense_date: expenseDate
            });
        }

        if (!imported.length) {
            importStatus.textContent = "No valid transactions were found.";
            return;
        }

        importStatus.textContent =
            "Importing " + imported.length + " transactions...";

        try {
            const response = await fetch("/expenses/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(imported)
            });

            const data = await response.json();

            if (!response.ok) {
                importStatus.textContent = data.detail || "Import failed.";
                return;
            }

            importStatus.textContent =
                data.imported_count + " transactions imported successfully.";

            statementFile.value = "";
            importFileName.textContent = "CSV files only";
            loadExpenses();

        } catch (error) {
            importStatus.textContent = "Unable to connect to the server.";
        }
    };

    reader.readAsText(file);
});


const receiptFile = document.querySelector("#receipt-file");
const scanReceiptButton = document.querySelector("#scan-receipt-button");
const receiptFileName = document.querySelector("#receipt-file-name");
const receiptPreviewWrap = document.querySelector("#receipt-preview-wrap");
const receiptPreview = document.querySelector("#receipt-preview");
const ocrStatus = document.querySelector("#ocr-status");
const receiptResult = document.querySelector("#receipt-result");
const receiptForm = document.querySelector("#receipt-form");

receiptFile.addEventListener("change", function() {
    if (!receiptFile.files.length) {
        return;
    }

    const file = receiptFile.files[0];
    receiptFileName.textContent = file.name;

    const reader = new FileReader();

    reader.onload = function(event) {
        receiptPreview.src = event.target.result;
        receiptPreviewWrap.classList.add("visible");
    };

    reader.readAsDataURL(file);
});

function findReceiptAmount(text) {
    const matches = text.match(/(?:₹|rs\.?|inr)?\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:₹|rs\.?|inr)\s*\d+(?:\.\d{1,2})?/gi) || [];
    const amounts = matches
        .map(function(value) {
            const number = Number(value.replace(/[^0-9.]/g, ""));
            return number;
        })
        .filter(function(value) {
            return value > 0 && value < 1000000;
        });

    if (!amounts.length) {
        return "";
    }

    const totalWords = /(grand total|net total|total amount|amount payable|amount due|balance)/i;

    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        if (totalWords.test(lines[i])) {
            const lineMatches = lines[i].match(/\d+(?:,\d{3})*(?:\.\d{1,2})?/g);

            if (lineMatches && lineMatches.length) {
                const value = Number(lineMatches[lineMatches.length - 1].replace(/,/g, ""));

                if (value > 0) {
                    return value;
                }
            }
        }
    }

    return Math.max.apply(null, amounts);
}

function findReceiptDate(text) {
    const match = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);

    if (!match) {
        const iso = text.match(/\b(20\d{2})[\/-](\d{1,2})[\/-](\d{1,2})\b/);

        if (iso) {
            return iso[1] + "-" +
                String(iso[2]).padStart(2, "0") + "-" +
                String(iso[3]).padStart(2, "0");
        }

        return "";
    }

    let day = Number(match[1]);
    let month = Number(match[2]);
    let year = Number(match[3]);

    if (year < 100) {
        year += 2000;
    }

    if (month > 12 && day <= 12) {
        const swap = day;
        day = month;
        month = swap;
    }

    if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) {
        return "";
    }

    return year + "-" +
        String(month).padStart(2, "0") + "-" +
        String(day).padStart(2, "0");
}

function findReceiptMerchant(text) {
    const lines = text
        .split(/\r?\n/)
        .map(function(line) {
            return line.trim();
        })
        .filter(function(line) {
            return line.length >= 3;
        });

    const ignored = /^(invoice|receipt|tax invoice|bill|date|time|gst|gstin|phone|mobile|total|subtotal|amount|cash|change|thank)/i;

    for (let i = 0; i < Math.min(lines.length, 8); i++) {
        const line = lines[i];

        if (!ignored.test(line) && !/^\d+$/.test(line) && line.length <= 60) {
            return line;
        }
    }

    return lines[0] || "Receipt expense";
}

function getReceiptCategory(text) {
    return guessCategory(text);
}

function showReceiptReview(data) {
    document.querySelector("#receipt-merchant").value = data.merchant;
    document.querySelector("#receipt-amount").value = data.amount;
    document.querySelector("#receipt-date").value = data.date || today;
    document.querySelector("#receipt-category").value = data.category;

    receiptResult.classList.add("ready");
}

scanReceiptButton.addEventListener("click", async function() {
    if (!receiptFile.files.length) {
        ocrStatus.textContent = "Choose a receipt image first.";
        return;
    }

    if (typeof Tesseract === "undefined") {
        ocrStatus.textContent = "OCR engine could not load. Check your internet connection and refresh.";
        return;
    }

    scanReceiptButton.disabled = true;
    scanReceiptButton.textContent = "Scanning...";
    ocrStatus.textContent = "Reading the receipt...";

    try {
        const result = await Tesseract.recognize(
            receiptFile.files[0],
            "eng",
            {
                logger: function(message) {
                    if (message.status === "recognizing text") {
                        ocrStatus.textContent =
                            "Reading receipt... " +
                            Math.round(message.progress * 100) +
                            "%";
                    }
                }
            }
        );

        const text = result.data.text.trim();

        if (!text) {
            throw new Error("No readable text found");
        }

        const merchant = findReceiptMerchant(text);
        const amount = findReceiptAmount(text);
        const date = findReceiptDate(text);

        showReceiptReview({
            merchant: merchant,
            amount: amount,
            date: date,
            category: getReceiptCategory(merchant + " " + text)
        });

        ocrStatus.textContent =
            "Receipt scanned. Review the extracted details before saving.";

    } catch (error) {
        ocrStatus.textContent =
            "We could not read this receipt clearly. Try a sharper, well-lit image.";
        console.log("Receipt OCR failed.", error);
    } finally {
        scanReceiptButton.disabled = false;
        scanReceiptButton.textContent = "Scan receipt";
    }
});

receiptForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const payment = document.querySelector("#receipt-payment").value;
    const transaction = document.querySelector("#receipt-transaction").value.trim();

    if (payment === "online" && !transaction) {
        alert("Enter a transaction/reference ID for an online payment.");
        return;
    }

    const expense = {
        user_id: user.id,
        amount: Number(document.querySelector("#receipt-amount").value),
        category: document.querySelector("#receipt-category").value,
        description: document.querySelector("#receipt-merchant").value.trim(),
        payment_mode: payment,
        transaction_id: transaction,
        expense_date: document.querySelector("#receipt-date").value
    };

    if (!expense.amount || !expense.description || !expense.expense_date) {
        alert("Please review the amount, description and date.");
        return;
    }

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
            alert(data.detail || "Unable to save scanned expense.");
            return;
        }

        ocrStatus.textContent = "Scanned expense added successfully.";
        receiptForm.reset();
        receiptResult.classList.remove("ready");
        receiptPreviewWrap.classList.remove("visible");
        receiptFile.value = "";
        receiptFileName.textContent = "JPG, PNG or WEBP";
        loadExpenses();

    } catch (error) {
        alert("Unable to connect to the server.");
    }
});
