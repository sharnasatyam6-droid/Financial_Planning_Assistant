const apiUrl = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "";

const forms = document.querySelectorAll(".auth-form");

function showSignupError(message) {
    let box = document.querySelector(".auth-error");

    if (!box) {
        box = document.createElement("div");
        box.className = "auth-error";
        box.style.marginBottom = "16px";
        box.style.padding = "12px 14px";
        box.style.border = "1px solid rgba(220, 70, 70, 0.35)";
        box.style.borderRadius = "10px";
        box.style.fontSize = "14px";
        box.style.lineHeight = "1.4";
        box.style.color = "#9f2d2d";
        box.style.background = "rgba(220, 70, 70, 0.06)";
        document.querySelector(".auth-form").prepend(box);
    }

    box.textContent = message;
    box.style.display = message ? "block" : "none";
}

forms.forEach(function(form) {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (document.title.includes("Create Account")) {
            const name = document.querySelector("#name").value.trim().replace(/\s+/g, " ");
            const mobile = document.querySelector("#mobile").value.trim();
            const email = document.querySelector("#email").value.trim().toLowerCase();
            const password = document.querySelector("#password").value;
            const confirmPassword = document.querySelector("#confirm-password").value;

            showSignupError("");

            if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$/.test(name)) {
                showSignupError("Please enter your real full name using letters, spaces, dots, hyphens or apostrophes.");
                return;
            }

            if (!/^[6-9]\d{9}$/.test(mobile)) {
                showSignupError("Please enter a valid 10 digit Indian mobile number.");
                return;
            }

            if (/^(.)\1{9}$/.test(mobile) || ["0123456789", "1234567890", "9876543210"].includes(mobile)) {
                showSignupError("Please enter your actual mobile number, not a sample number.");
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                showSignupError("Please enter an email address that you actually use.");
                return;
            }

            if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
                showSignupError("Password must be at least 8 characters and contain a letter and a number.");
                return;
            }

            if (password !== confirmPassword) {
                showSignupError("Passwords do not match.");
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/auth/signup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        mobile: mobile,
                        email: email,
                        password: password,
                        confirm_password: confirmPassword
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    showSignupError(data.detail || "Please check your details and try again.");
                    return;
                }

                alert("Account created successfully!");
                window.location.href = "login.html";

            } catch (error) {
                showSignupError("Unable to connect to the server.");
            }

        } else {
            const mobile = document.querySelector("#mobile").value.trim();
            const password = document.querySelector("#password").value;

            try {
                const response = await fetch(`${apiUrl}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        mobile: mobile,
                        password: password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.detail);
                    return;
                }

                localStorage.setItem("finoraUser", JSON.stringify(data.user));

                try {
                    const profileResponse = await fetch(`/profile/${data.user.id}`);

                    if (profileResponse.ok) {
                        window.location.href = "dashboard.html";
                    } else {
                        window.location.href = "onboarding.html";
                    }

                } catch (error) {
                    window.location.href = "onboarding.html";
                }

            } catch (error) {
                alert("Unable to connect to the server.");
            }
        }
    });
});