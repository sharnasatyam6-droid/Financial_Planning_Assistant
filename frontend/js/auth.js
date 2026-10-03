const apiUrl = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "";

const forms = document.querySelectorAll(".auth-form");

forms.forEach(function(form) {
    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (document.title.includes("Create Account")) {
            const name = document.querySelector("#name").value.trim();
            const mobile = document.querySelector("#mobile").value.trim();
            const email = document.querySelector("#email").value.trim();
            const password = document.querySelector("#password").value;
            const confirmPassword = document.querySelector("#confirm-password").value;

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
                    alert(data.detail);
                    return;
                }

                alert("Account created successfully!");
                window.location.href = "login.html";

            } catch (error) {
                alert("Unable to connect to the server.");
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

                alert("Login successful!");

            } catch (error) {
                alert("Unable to connect to the server.");
            }
        }
    });
});