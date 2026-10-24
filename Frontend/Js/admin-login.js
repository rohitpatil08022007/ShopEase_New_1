
const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

adminLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    loginMessage.textContent = "Checking admin login...";

    try {
        const response = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            loginMessage.textContent = data.message || "Login failed.";
            return;
        }

        if (data.role !== "ADMIN") {
            loginMessage.textContent = "Access denied. Admin account required.";
            return;
        }

        localStorage.setItem("shopease_admin_email", email);

        loginMessage.textContent = "Admin login successful!";

        window.location.href = "orders.html";

    } catch (error) {
        loginMessage.textContent =
            "Backend connection failed. Check whether backend is running.";
    }
});
