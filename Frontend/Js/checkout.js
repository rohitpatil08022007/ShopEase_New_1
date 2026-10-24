
const API_URL = "http://localhost:8080/api/cart";
const CHECKOUT_KEY = "shopease_demo_checkout";

const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");
const deliveryDate = document.getElementById("deliveryDate");
const checkoutForm = document.getElementById("checkoutForm");

function getUserEmail() {
    try {
        const user = JSON.parse(
            localStorage.getItem("shopease_user") || "null"
        );

        if (
            localStorage.getItem("shopease_logged_in") !== "true" ||
            !user?.email
        ) {
            return null;
        }

        return user.email;
    } catch {
        return null;
    }
}

function formatPrice(price) {
    return "₹" + Number(price || 0).toLocaleString("en-IN");
}

async function getCart() {
    const email = getUserEmail();

    if (!email) {
        window.location.href = "login.html";
        throw new Error("Please login first.");
    }

    const response = await fetch(API_URL, {
        headers: {
            "X-User-Email": email
        }
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
        throw new Error("Unable to load cart. Please try again.");
    }

    return Array.isArray(data) ? data : [];
}

async function showOrderSummary() {
    checkoutItems.innerHTML = "<p>Loading products...</p>";
    checkoutTotal.textContent = "Total Amount: ₹0";

    try {
        const cart = await getCart();
        checkoutItems.innerHTML = "";

        const submitButton = checkoutForm.querySelector(
            'button[type="submit"]'
        );

        if (cart.length === 0) {
            checkoutItems.innerHTML = "<p>Your cart is empty.</p>";
            if (submitButton) submitButton.disabled = true;
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            total += price * quantity;

            const row = document.createElement("div");
            row.className = "checkout-item";

            const name = document.createElement("p");
            name.textContent =
                (item.productName || item.name || "Product") +
                " × " + quantity;

            const amount = document.createElement("strong");
            amount.textContent = formatPrice(price * quantity);

            row.append(name, amount);
            checkoutItems.appendChild(row);
        });

        checkoutTotal.textContent = "Total Amount: " + formatPrice(total);

        const date = new Date();
        date.setDate(date.getDate() + 4);

        deliveryDate.textContent =
            "Estimated delivery: " +
            date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        if (submitButton) submitButton.disabled = false;

    } catch (error) {
        checkoutItems.innerHTML = "";
        const message = document.createElement("p");
        message.textContent = error.message;
        checkoutItems.appendChild(message);
    }
}

checkoutForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = checkoutForm.querySelector(
        'button[type="submit"]'
    );

    try {
        const cart = await getCart();

        if (cart.length === 0) {
            alert("Your cart is empty. Please add products first.");
            window.location.href = "cart.html";
            return;
        }

        const customer = {
            name: document.getElementById("customerName").value.trim(),
            mobile: document.getElementById("customerMobile").value.trim(),
            email: document.getElementById("customerEmail").value.trim(),
            address: document.getElementById("customerAddress").value.trim(),
            city: document.getElementById("customerCity").value.trim(),
            pincode: document.getElementById("customerPincode").value.trim()
        };

        localStorage.setItem(
            CHECKOUT_KEY,
            JSON.stringify({
                customer: customer,
                checkoutDate: new Date().toISOString()
            })
        );

        window.location.href = "payment.html";

    } catch (error) {
        alert(error.message);
    }
});

showOrderSummary();
