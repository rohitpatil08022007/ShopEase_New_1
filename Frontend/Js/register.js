
const registerForm = document.getElementById("registerForm");

const fullName = document.getElementById("fullName");
const mobile = document.getElementById("mobile");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const message = document.getElementById("message");

const API_URL = "http://localhost:8080/api/users/register";

mobile.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userData = {
        name: fullName.value.trim(),
        mobile: mobile.value.trim(),
        email: email.value.trim(),
        password: password.value
    };

    if (userData.name.length < 3) {
        showMessage("Name must contain at least 3 characters.", "red");
        return;
    }

    if (!/^[0-9]{10}$/.test(userData.mobile)) {
        showMessage("Enter a valid 10-digit mobile number.", "red");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        showMessage("Enter a valid email address.", "red");
        return;
    }

    if (userData.password.length < 8) {
        showMessage("Password must contain at least 8 characters.", "red");
        return;
    }

    if (userData.password !== confirmPassword.value) {
        showMessage("Passwords do not match.", "red");
        return;
    }

    try {
        showMessage("Registering...", "black");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed");
        }

        localStorage.setItem("shopease_user", JSON.stringify({
            name: result.name,
            email: result.email,
            mobile: result.mobile
        }));

        showMessage("Registration successful! Redirecting to login...", "green");
        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        showMessage(error.message || "Backend connection failed.", "red");
    }
});

function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
}
