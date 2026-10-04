# Finora — Personal Financial Planning Assistant

> A goal-first personal finance awareness platform that helps users understand spending, plan savings, track expenses, and make better day-to-day financial decisions.

Finora is a hackathon project built around the idea that a bank statement should not just show **where money went** — it should help users understand **where they stand and what they can do next**.

The platform brings financial data, daily expenses, savings goals, budgets, alerts, analytics, receipt OCR, and financial insights into one simple dashboard.

---

## ✨ What Finora Does

Finora turns scattered financial information into a continuous planning loop:

**Import → Analyze → Categorize → Plan → Track → Detect → Alert → Recalculate**

Users can:

- Create an account and log in securely
- Complete their financial profile
- Record cash and online expenses
- Import transaction data using CSV
- Scan receipts using OCR
- Automatically categorize expenses
- Set a monthly savings goal
- Generate a goal-based spending budget
- Monitor savings and spending progress
- View spending trends and category breakdowns
- Receive alerts when spending or goal progress needs attention
- Explore financial health insights
- Run what-if simulations to understand the effect of reducing expenses or increasing savings

---

## 🎯 Problem We Are Solving

Many people can see their transactions, but they still struggle to answer simple questions:

- Where is my money actually going?
- Which category is consuming most of my budget?
- Am I spending too much this month?
- Can I still reach my savings goal?
- What happens if I reduce a particular type of spending?
- When should I take action before my goal is affected?

Traditional statements provide transaction history, but not enough **context, planning, or continuous feedback**.

Finora is designed to bridge that gap.

---

## 💡 Core Idea

Instead of starting with investments or complicated financial products, Finora starts with something much more practical:

> **Understand your money. Set a goal. Build a plan. Track it continuously.**

The platform follows a **goal-first planning approach**.

For example:

If a user wants to save **₹10,000 per month**, Finora can compare:

- Income
- Fixed expenses
- Variable spending
- Current savings
- Remaining monthly budget
- Goal progress

It can then highlight whether the user is on track, approaching a limit, or needs to adjust spending.

---

## 🚀 Key Features

### 🔐 Authentication

- Account registration
- Mobile number and email
- Password hashing
- Login validation
- User-specific financial data

### 💳 Expense Tracking

Supports multiple ways to record expenses:

- Cash expenses
- Online expenses
- Transaction/reference IDs
- Expense descriptions
- Categories
- Expense dates

### 📄 CSV Import

Users can import transaction data instead of entering every transaction manually.

Finora handles:

- Column detection
- Date normalization
- Category detection
- Transaction validation
- Duplicate transaction protection

### 📷 Receipt OCR

The receipt scanner uses **Tesseract.js** to extract useful information from receipt images.

It can attempt to identify:

- Amount
- Date
- Merchant
- Expense category

The extracted information is shown for review before saving.

### 🎯 Savings Goals

Users can create a savings goal with:

- Goal name
- Target amount
- Target date

Finora calculates the required monthly saving and connects the goal with the user's spending capacity.

### 📊 Budget Planning

The budget engine considers the user's financial profile and savings goal to estimate a practical spending budget.

It tracks states such as:

- Healthy
- Near Limit
- Over Budget

### 🚨 Smart Alerts

Finora checks financial conditions and generates alerts for situations such as:

- Goal progress falling behind
- Spending approaching a budget limit
- Spending going over the planned budget
- High concentration in a spending category
- Positive financial progress

### 📈 Financial Analytics

The dashboard provides visual information about:

- Total spending
- Category distribution
- Monthly spending trends
- Spending patterns
- Savings progress
- Financial health

### 🧠 Financial Insights

The insights module turns financial data into understandable observations rather than simply displaying numbers.

It includes:

- Financial Signal Score
- Current financial picture
- Spending patterns
- Action-oriented insights
- What-if simulations

### 🔮 What-If Simulation

Users can experiment with scenarios such as:

> "What if I reduce my monthly spending by ₹2,000?"

or

> "What if I save an additional ₹1,000 every month?"

Finora estimates how these changes can affect spending capacity and goal progress.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     Finora UI       │
                    │ HTML / CSS / JS     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │      REST APIs      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │    Auth     │   │  Expenses   │   │    Goals    │
      └─────────────┘   └─────────────┘   └─────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Financial Analysis  │
                    │ & Insight Engine    │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          ┌──────────┐   ┌──────────┐   ┌──────────┐
          │ Analytics│   │  Alerts  │   │ Insights │
          └──────────┘   └──────────┘   └──────────┘
```

---

## 🛠️ Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Chart.js
- Tesseract.js

### Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

### Database

- SQLite for the current local prototype
- Database layer structured for future database expansion

### Security

- Password hashing with `pwdlib`
- User-specific database records
- Input validation
- Duplicate transaction protection
- No unnecessary banking credentials

---

## 📁 Project Structure

```text
Financial_Planning_Assistant/
│
├── backend/
│   ├── app.py
│   │
│   ├── database/
│   │   └── database.py
│   │
│   └── routes/
│       ├── auth.py
│       ├── profile.py
│       ├── expenses.py
│       ├── goals.py
│       ├── alerts.py
│       └── insights.py
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── onboarding.html
│   ├── dashboard.html
│   ├── expenses.html
│   ├── goals.html
│   ├── alerts.html
│   ├── insights.html
│   │
│   ├── css/
│   │   ├── style.css
│   │   └── insights.css
│   │
│   └── js/
│       ├── auth.js
│       ├── expenses.js
│       └── insights.js
│
├── .env.example
├── .gitignore
├── pyproject.toml
├── requirements.txt
└── README.md
```

---

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/sharnasatyam6-droid/Financial_Planning_Assistant.git
cd Financial_Planning_Assistant
```

### 2. Create a virtual environment

Windows:

```powershell
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the FastAPI server

```bash
python -m uvicorn backend.app:app --reload
```

### 5. Open Finora

Visit:

```text
http://127.0.0.1:8000
```

The SQLite database is created automatically when the application starts.

---

## 🔄 User Journey

```text
Create Account
      ↓
Login
      ↓
Financial Profile
      ↓
Dashboard
      ↓
Import / Add Expenses
      ↓
Analyze Spending
      ↓
Set Savings Goal
      ↓
Generate Budget
      ↓
Track Progress
      ↓
Receive Alerts
      ↓
Explore Insights
      ↓
Run What-If Scenarios
```

---

## 🧠 Financial Awareness, Not Financial Advice

Finora is designed as a **financial awareness and planning tool**.

It does not provide:

- Investment recommendations
- Securities advice
- Loan recommendations
- Insurance recommendations
- Regulated financial advice

The purpose is to help users understand their own financial behavior and plan around personal goals.

---

## 🔒 Privacy & Security Principles

Financial information is sensitive. The project follows a privacy-first direction:

- Do not request unnecessary banking credentials
- Validate user input
- Hash passwords instead of storing them as plain text
- Keep financial records associated with the correct user
- Protect uploaded financial documents
- Use secure connections when deployed
- Minimize unnecessary financial data collection

The current hackathon prototype uses user-provided financial data rather than direct bank-account connections.

---

## 🗺️ Development Roadmap

| Version | Milestone | Status |
|---|---|---|
| v0.1 | Project foundation & landing page | ✅ |
| v0.2 | Login & signup UI | ✅ |
| v0.3 | Real local authentication | ✅ |
| v0.4 | Financial onboarding & dashboard | ✅ |
| v0.5 | Expense tracking & analytics | ✅ |
| v0.6 | Financial analytics & dashboard intelligence | ✅ |
| v0.7 | Savings goal & budget engine | ✅ |
| v0.8 | Alerts & financial insights | ✅ |
| v0.9 | OCR & intelligent expense processing | ✅ |
| v1.0 | Final hackathon demo & polish | 🚧 |

---

## 🔮 Future Scope

Future versions can include:

- OTP-based authentication
- More advanced AI-powered transaction categorization
- Better receipt/document OCR
- Bank statement parsing for additional formats
- Explainable AI financial recommendations
- More advanced spending forecasts
- Personalized budget adaptation
- What-if financial scenario planning
- PostgreSQL/cloud database support
- Secure production deployment
- Improved privacy controls
- Mobile-first experience

---

## 🏆 Hackathon Focus

Finora is designed as a practical MVP for the **Personal Financial Planning Assistant** problem statement.

The prototype focuses on demonstrating the complete product loop rather than depending on direct banking integrations:

**Financial Data → Analysis → Goal → Budget → Tracking → Alerts → Insights**

This keeps the solution technically feasible while demonstrating how the concept can be expanded into a larger financial-awareness platform.

---

## 👥 Project

**Finora — Personal Financial Planning Assistant**

Built as a student hackathon project with a focus on:

- Financial awareness
- Goal-based planning
- Data-driven insights
- Practical automation
- Clean user experience
- Explainable financial feedback

---

## 📄 License

This project is currently intended as a hackathon/student project. Add an open-source license here if the repository is later released for public reuse.
