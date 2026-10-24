
if (performance.getEntriesByType("navigation")[0]?.type !== "back_forward") {
    window.addEventListener("pageshow", () => {
        const email = document.getElementById("email");
        const password = document.getElementById("password");

        if (email) email.value = "";
        if (password) password.value = "";
    });
}

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const API_URL = "http://localhost:8080/api/auth/login";

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.textContent = isPassword ? "Hide" : "Show";
    togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
    );
});

emailInput.addEventListener("input", () => {
    emailError.textContent = "";
    message.textContent = "";
    message.className = "message";
});

passwordInput.addEventListener("input", () => {
    passwordError.textContent = "";
    message.textContent = "";
    message.className = "message";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    message.textContent = "";
    message.className = "message";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        emailError.textContent = "Please enter your email address.";
        isValid = false;
    } else if (!emailPattern.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        isValid = false;
    }

    if (!password) {
        passwordError.textContent = "Please enter your password.";
        isValid = false;
    }

    if (!isValid) {
        message.textContent = "Please correct the errors above.";
        message.classList.add("error");
        return;
    }

    try {
        if (loginBtn) loginBtn.disabled = true;
        message.textContent = "Checking login details...";
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        localStorage.setItem("shopease_logged_in", "true");
        localStorage.setItem("shopease_user", JSON.stringify({
            name: result.name || "",
            email: email,
            mobile: result.mobile || ""
        }));

        message.textContent = "Login successful! Opening Home page...";
        message.classList.add("success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {
        message.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to backend. Make sure it is running."
                : error.message;
        message.classList.add("error");
    } finally {
        if (loginBtn) loginBtn.disabled = false;
    }
});
