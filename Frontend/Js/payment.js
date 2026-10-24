const CART_KEY = "shopease_demo_cart";
const ORDERS_KEY = "shopease_demo_orders";
const CHECKOUT_KEY = "shopease_demo_checkout";

const paymentItems = document.getElementById("paymentItems");
const paymentSubtotal = document.getElementById("paymentSubtotal");
const paymentDiscount = document.getElementById("paymentDiscount");
const paymentTotal = document.getElementById("paymentTotal");
const paymentForm = document.getElementById("paymentForm");

function formatPrice(price) {
    return "₹" + Number(price || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("shopease_user") || "null");
    } catch {
        return null;
    }
}

async function getCart() {
    const user = getUser();

    if (
        localStorage.getItem("shopease_logged_in") !== "true" ||
        !user?.email
    ) {
        window.location.href = "login.html";
        throw new Error("Please login first.");
    }

    const response = await fetch("http://localhost:8080/api/cart", {
        headers: {
            "X-User-Email": user.email
        }
    });

    if (!response.ok) {
        throw new Error("Cart load failed. Please check the backend.");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

function getSubtotal(cart) {
    return cart.reduce((sum, item) => {
        return sum +
            Number(item.price || 0) *
            (Number(item.quantity) || 1);
    }, 0);
}

function getDiscount(subtotal, method) {
    if (!method || method === "COD") {
        return 0;
    }

    return Math.min(subtotal * 0.10, 1000);
}

function getOnlineDiscount(subtotal, method) {
    if (!method || method === "COD" || subtotal <= 0) {
        return 0;
    }

    return subtotal * (Math.floor(Math.random() * 5) + 1) / 100;
}

let selectedOnlinePercent = 0;

function getSelectedMethod() {
    const selected = document.querySelector(
        'input[name="paymentMethod"]:checked'
    );

    return selected ? selected.value : null;
}

function updatePaymentDiscount() {
    const method = getSelectedMethod();
    const cart = window.currentPaymentCart || [];
    const subtotal = getSubtotal(cart);

    const bankDiscount = getDiscount(subtotal, method);

    const onlineDiscount =
        method && method !== "COD"
            ? subtotal * selectedOnlinePercent / 100
            : 0;

    const total = Math.max(
        0,
        subtotal - bankDiscount - onlineDiscount
    );

    paymentDiscount.textContent =
        "Bank Offer: -" + formatPrice(bankDiscount) +
        " | Online Discount: " +
        (method && method !== "COD" ? selectedOnlinePercent : 0) +
        "% -" + formatPrice(onlineDiscount);

    paymentTotal.textContent = "Total Amount: " + formatPrice(total);
}

async function showPaymentSummary() {
    try {
        const cart = await getCart();

        window.currentPaymentCart = cart;
        paymentItems.innerHTML = "";

        if (cart.length === 0) {
            paymentItems.textContent = "Your cart is empty.";
            paymentSubtotal.textContent = "Subtotal: ₹0";
            paymentDiscount.textContent = "Bank Offer: ₹0";
            paymentTotal.textContent = "Total Amount: ₹0";

            const button = paymentForm.querySelector(
                'button[type="submit"]'
            );

            if (button) button.disabled = true;
            return;
        }

        cart.forEach(item => {
            const row = document.createElement("p");
            const quantity = Number(item.quantity) || 1;
            const amount = Number(item.price || 0) * quantity;
            const name = item.productName || item.name || "Product";

            row.textContent =
                `${name} × ${quantity} — ${formatPrice(amount)}`;

            paymentItems.appendChild(row);
        });

        const subtotal = getSubtotal(cart);

        paymentSubtotal.textContent =
            "Subtotal: " + formatPrice(subtotal);

        const method = getSelectedMethod();

        if (method && method !== "COD") {
            if (selectedOnlinePercent === 0) {
                selectedOnlinePercent =
                    Math.floor(Math.random() * 5) + 1;
            }
        }

        updatePaymentDiscount();

        const button = paymentForm.querySelector(
            'button[type="submit"]'
        );

        if (button) button.disabled = false;

    } catch (error) {
        paymentItems.textContent = error.message;
        console.error("Payment cart error:", error);
    }
}

document.querySelectorAll(
    'input[name="paymentMethod"]'
).forEach(input => {
    input.addEventListener("change", function () {
        if (this.value !== "COD") {
            selectedOnlinePercent =
                Math.floor(Math.random() * 5) + 1;
        }

        updatePaymentDiscount();
    });
});

paymentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = paymentForm.querySelector(
        'button[type="submit"]'
    );

    if (button) button.disabled = true;

    try {
        const user = getUser();

        if (
            localStorage.getItem("shopease_logged_in") !== "true" ||
            !user?.email
        ) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const cart = await getCart();

        if (cart.length === 0) {
            alert("Your cart is empty. Please add products first.");
            window.location.href = "products.html";
            return;
        }

        let checkoutData;

        try {
            checkoutData = JSON.parse(
                localStorage.getItem(CHECKOUT_KEY) || "null"
            );
        } catch {
            checkoutData = null;
        }

        const customer = checkoutData?.customer;

        if (!customer || !String(customer.name || "").trim()) {
            alert("Please enter your delivery details first.");
            window.location.href = "checkout.html";
            return;
        }

        const selectedMethod = getSelectedMethod();

        if (!selectedMethod) {
            alert("Please select a payment method.");
            return;
        }

        const subtotal = getSubtotal(cart);
        const method = selectedMethod;
        const discount = getDiscount(subtotal, method);

        const onlineDiscount =
            method === "COD"
                ? 0
                : subtotal * selectedOnlinePercent / 100;

        const total = Math.max(
            0,
            subtotal - discount - onlineDiscount
        );

        const results = [];

        for (const item of cart) {
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const productName =
                item.productName || item.name || "Product";

            const orderData = {
                customerName: String(customer.name || "").trim(),
                customerEmail: String(customer.email || user.email).trim(),
                customerMobile: String(customer.mobile || "").trim(),
                deliveryAddress: String(customer.address || "").trim(),
                deliveryCity: String(customer.city || "").trim(),
                deliveryPincode: String(customer.pincode || "").trim(),
                productName: productName,
                quantity: quantity,
                totalAmount: price * quantity,
                paymentMethod: method
            };

            console.log("Order payload:", orderData);

            const response = await fetch(
                "http://localhost:8080/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User-Email": user.email
                    },
                    body: JSON.stringify(orderData)
                }
            );

            const responseText = await response.text();

            let result = {};

            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch {
                result = { message: responseText };
            }

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Order save failed. HTTP " + response.status
                );
            }

            results.push(result);

            const paymentData = {
                orderId: result.orderId,
                amount: Number(orderData.totalAmount),
                paymentMethod: method
            };

            const paymentResponse = await fetch(
                "http://localhost:8080/api/payments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User-Email": user.email
                    },
                    body: JSON.stringify(paymentData)
                }
            );

            if (!paymentResponse.ok) {
                throw new Error("Demo payment record save failed.");
            }
        }

        const localOrder = {
            orderId: results[0]?.orderId || ("SE" + Date.now()),
            customer: customer,
            items: cart,
            subtotal: subtotal,
            discount: discount + onlineDiscount,
            total: total,
            paymentMethod: method,
            paymentStatus: "Demo - Not Charged",
            orderDate: new Date().toISOString(),
            status: "PLACED"
        };

        let orders = [];

        try {
            orders = JSON.parse(
                localStorage.getItem(ORDERS_KEY) || "[]"
            );

            if (!Array.isArray(orders)) {
                orders = [];
            }
        } catch {
            orders = [];
        }

        orders.push(localOrder);

        localStorage.setItem(
            ORDERS_KEY,
            JSON.stringify(orders)
        );

        await fetch("http://localhost:8080/api/cart/clear", {
            method: "DELETE",
            headers: {
                "X-User-Email": user.email
            }
        });

        localStorage.removeItem(CART_KEY);
        localStorage.removeItem(CHECKOUT_KEY);


        const modal = document.getElementById("orderSuccessModal");

        document.getElementById("successOrderId").textContent =
            "Order ID: " + localOrder.orderId;

        document.getElementById("successPaymentMethod").textContent =
            "Payment Method: " + method;

        document.getElementById("successTotal").textContent =
            "Total: " + formatPrice(total);

        if (modal) {
            modal.style.display = "flex";
        }

        document.getElementById("viewOrdersBtn").onclick = function () {
            window.location.href = "orders.html";
        };


    } catch (error) {
        console.error("Order API error:", error);

        alert(
            "Order save failed: " + error.message +
            "\nYour cart has been kept."
        );

    } finally {
        if (button) button.disabled = false;
    }
});

showPaymentSummary();