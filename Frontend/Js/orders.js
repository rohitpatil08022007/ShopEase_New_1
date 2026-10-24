const ordersContainer = document.getElementById("ordersContainer");

const API_URL = "http://localhost:8080/api/orders";
const CART_API = "http://localhost:8080/api/cart";
const PRODUCT_FEEDBACK_API = "http://localhost:8080/api/product-feedback";

function getUser() {
    try {
        return JSON.parse(
            localStorage.getItem("shopease_user") || "null"
        );
    } catch {
        return null;
    }
}

function formatPrice(price) {
    return "₹" + Number(price || 0).toLocaleString("en-IN");
}

function formatDateTime(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function isCancelled(status) {
    return ["CANCELLED", "ORDER CANCELLED"].includes(
        String(status || "").toUpperCase()
    );
}

function displayStatus(status) {
    const statuses = {
        PLACED: "Order Placed",
        PACKED: "Packed",
        SHIPPED: "Shipped",
        DELIVERED: "Delivered",
        CANCELLED: "Order Cancelled",
        "ORDER CANCELLED": "Order Cancelled"
    };

    return statuses[String(status || "").toUpperCase()]
        || status
        || "Order Placed";
}

// Get logged-in customer's orders
async function fetchOrders() {
    const user = getUser();

    if (
        localStorage.getItem("shopease_logged_in") !== "true" ||
        !user?.email
    ) {
        window.location.href = "login.html";
        return [];
    }

    const response = await fetch(API_URL, {
        headers: {
            "X-User-Email": user.email
        }
    });

    if (response.status === 401) {
        localStorage.removeItem("shopease_logged_in");
        window.location.href = "login.html";
        return [];
    }

    if (!response.ok) {
        throw new Error(
            "Orders load झाले नाहीत. HTTP " + response.status
        );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
}

// Get products from an order
function getItems(order) {
    if (Array.isArray(order.items)) {
        return order.items;
    }

    if (order.productName) {
        return [{
            productId: order.productId,
            productName: order.productName,
            name: order.productName,
            quantity: Number(order.quantity) || 1,
            price: order.price != null
                ? Number(order.price)
                : Number(order.totalAmount || 0) /
                    (Number(order.quantity) || 1),
            totalAmount: order.totalAmount
        }];
    }

    return [];
}

// Add customer information rows
function addInfoRow(container, label, value) {
    const row = document.createElement("p");
    row.className = "order-info-row";

    const labelElement = document.createElement("strong");
    labelElement.textContent = label + ": ";

    const valueElement = document.createElement("span");

    valueElement.textContent =
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
            ? String(value)
            : "Not available";

    row.append(labelElement, valueElement);
    container.appendChild(row);
}

// Cancel an order
async function cancelOrder(order, button) {
    const user = getUser();

    if (
        localStorage.getItem("shopease_logged_in") !== "true" ||
        !user?.email
    ) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    if (!confirm("Are you sure you want to cancel this order?")) {
        return;
    }

    button.disabled = true;
    button.textContent = "Cancelling...";

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(order.orderId)}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user.email
                },
                body: JSON.stringify({
                    status: "CANCELLED"
                })
            }
        );

        if (response.status === 404) {
            throw new Error(
                "Order सापडला नाही किंवा तो तुमचा नाही."
            );
        }

        if (!response.ok) {
            throw new Error(
                "Cancel failed. HTTP " + response.status
            );
        }

        alert("Order cancelled successfully!");
        await renderOrders();

    } catch (error) {
        console.error("Cancel order error:", error);

        alert(error.message || "Order cancel करता आला नाही.");

        button.disabled = false;
        button.textContent = "Cancel Order";
    }
}

// Find the correct product ID
async function findProductId(item) {
    const existingId = Number(item.productId ?? item.id);

    if (Number.isInteger(existingId) && existingId > 0) {
        return existingId;
    }

    const response = await fetch(
        "http://localhost:8080/api/products"
    );

    if (!response.ok) {
        throw new Error(
            "Products API मधून product शोधता आला नाही."
        );
    }

    const products = await response.json();

    const itemName = String(
        item.productName || item.name || ""
    ).trim().toLowerCase();

    const product = products.find(p =>
        String(p.productName || p.name || p.title || "")
            .trim()
            .toLowerCase() === itemName
    );

    const id = Number(product?.productId ?? product?.id);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
            "Product ID सापडला नाही: " +
            (item.productName || item.name)
        );
    }

    return id;
}

// Buy the same products again
async function buyAgain(order, button) {
    const user = getUser();

    if (
        localStorage.getItem("shopease_logged_in") !== "true" ||
        !user?.email
    ) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const items = getItems(order);

    if (items.length === 0) {
        alert("No products found in this order.");
        return;
    }

    button.disabled = true;
    button.textContent = "Adding...";

    try {
        for (const item of items) {
            const productId = await findProductId(item);

            const response = await fetch(`${CART_API}/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Email": user.email
                },
                body: JSON.stringify({
                    productId,
                    productName:
                        item.productName || item.name || "Product",
                    price: Number(item.price) || 0,
                    quantity: Number(item.quantity) || 1
                })
            });

            if (!response.ok) {
                throw new Error(
                    "Cart API failed: HTTP " + response.status
                );
            }
        }

        window.location.href = "cart.html";

    } catch (error) {
        console.error("Buy Again error:", error);

        alert("Buy Again failed: " + error.message);

    } finally {
        button.disabled = false;
        button.textContent = "Buy Again";
    }
}

// Feedback form: delivered orders only
async function addProductFeedbackForm(order, item, container) {
    const status = String(order.status || "").toUpperCase();

    if (status !== "DELIVERED") {
        return;
    }

    const productName =
        item.productName || item.name || order.productName;

    if (!productName) return;

    const productId = await findProductId(item);

    if (!productId) return;

    const section = document.createElement("section");
    section.className = "order-feedback-form";

    const heading = document.createElement("h4");
    heading.textContent = "Share Your Product Feedback";

    const ratingLabel = document.createElement("label");
    ratingLabel.textContent = "Rating:";

    const rating = document.createElement("select");
    rating.required = true;

    [
        ["5", "5 - Excellent"],
        ["4", "4 - Very Good"],
        ["3", "3 - Good"],
        ["2", "2 - Fair"],
        ["1", "1 - Poor"]
    ].forEach(([value, labelText]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelText;
        rating.appendChild(option);
    });

    const commentLabel = document.createElement("label");
    commentLabel.textContent = "Your Feedback:";

    const comment = document.createElement("textarea");
    comment.placeholder = "Write your product feedback...";
    comment.required = true;
    comment.maxLength = 1000;

    const submit = document.createElement("button");
    submit.type = "button";
    submit.textContent = "Submit Feedback";
    submit.className = "primary-btn";

    const message = document.createElement("p");
    message.className = "feedback-message";

    submit.addEventListener("click", async () => {
        const feedbackText = comment.value.trim();

        if (!feedbackText) {
            message.textContent = "Please enter your feedback.";
            return;
        }

        submit.disabled = true;
        message.textContent = "Submitting feedback...";

        try {
            const user = getUser();

            if (!user || !user.email) {
                throw new Error(
                    "Please login before submitting feedback."
                );
            }

            const response = await fetch(
                PRODUCT_FEEDBACK_API,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-User-Email": user.email
                    },
                    body: JSON.stringify({
                        orderId: order.orderId,
                        productId: productId,
                        productName: productName,
                        rating: Number(rating.value),
                        comment: feedbackText
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Could not submit feedback."
                );
            }

            message.textContent =
                "Feedback submitted successfully!";

            rating.disabled = true;
            comment.disabled = true;
            submit.disabled = true;

        } catch (error) {
            message.textContent = error.message;
            submit.disabled = false;
        }
    });

    section.append(
        heading,
        ratingLabel,
        rating,
        commentLabel,
        comment,
        submit,
        message
    );

    container.appendChild(section);
}

// Render customer orders
async function renderOrders() {
    if (!ordersContainer) return;

    // Do not erase feedback while the customer is typing
    const activeElement = document.activeElement;

    if (
        activeElement &&
        ordersContainer.contains(activeElement) &&
        activeElement.closest(".order-feedback-form") &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)
    ) {
        return;
    }

    ordersContainer.innerHTML = "<p>Loading orders...</p>";

    try {
        const orders = await fetchOrders();

        if (!ordersContainer.isConnected) return;

        ordersContainer.innerHTML = "";

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <section class="order-empty">
                    <h3>No Orders Yet!</h3>
                    <p>Your placed orders will appear here.</p>
                    <a class="primary-btn" href="products.html">
                        Start Shopping
                    </a>
                </section>
            `;
            return;
        }

        for (const order of orders.slice().reverse()) {
            const card = document.createElement("section");
            card.className = "order-card";

            // Order heading
            const heading = document.createElement("div");
            heading.className = "order-heading";

            const title = document.createElement("h3");
            title.textContent = "Order #" + order.orderId;

            const status = document.createElement("span");
            status.className = "order-status";
            status.textContent = displayStatus(order.status);

            heading.append(title, status);
            card.appendChild(heading);

            // Tracking
            const tracking = document.createElement("div");
            tracking.className = "order-tracking";

            if (isCancelled(order.status)) {
                tracking.textContent = "Order Cancelled";
            } else {
                const steps = [
                    ["PLACED", "Order Placed"],
                    ["PACKED", "Packed"],
                    ["SHIPPED", "Shipped"],
                    ["DELIVERED", "Delivered"]
                ];

                const current = steps.findIndex(
                    step =>
                        step[0] ===
                        String(order.status || "PLACED").toUpperCase()
                );

                steps.forEach((step, index) => {
                    const element = document.createElement("div");
                    element.className = "tracking-step";

                    if (index <= Math.max(0, current)) {
                        element.classList.add("completed");
                    }

                    element.textContent =
                        (index <= Math.max(0, current) ? "✓ " : "") +
                        step[1];

                    tracking.appendChild(element);
                });
            }

            card.appendChild(tracking);

            // Order date and delivery date/time
            const dateSection = document.createElement("div");
            dateSection.className = "order-date-section";

            addInfoRow(
                dateSection,
                "Order Date & Time",
                formatDateTime(order.orderDate)
            );

            addInfoRow(
                dateSection,
                "Estimated Delivery",
                formatDateTime(order.estimatedDeliveryDate)
            );

            card.appendChild(dateSection);

            // Customer details
            const customerHeading = document.createElement("h4");
            customerHeading.textContent = "Customer Details";
            card.appendChild(customerHeading);

            const customerDetails = document.createElement("div");
            customerDetails.className = "order-customer-details";

            addInfoRow(
                customerDetails,
                "Name",
                order.customerName
            );

            addInfoRow(
                customerDetails,
                "Email",
                order.customerEmail
            );

            addInfoRow(
                customerDetails,
                "Mobile",
                order.customerMobile
            );

            addInfoRow(
                customerDetails,
                "Address",
                order.deliveryAddress
            );

            addInfoRow(
                customerDetails,
                "City",
                order.deliveryCity
            );

            addInfoRow(
                customerDetails,
                "PIN Code",
                order.deliveryPincode
            );

            card.appendChild(customerDetails);

            // Products
            const headingProducts = document.createElement("h4");
            headingProducts.textContent = "Products";
            card.appendChild(headingProducts);

            const items = getItems(order);

            for (const item of items) {
                const row = document.createElement("div");
                row.className = "order-item";

                const name = document.createElement("span");
                name.textContent =
                    (item.productName || item.name || "Product") +
                    " × " + (Number(item.quantity) || 1);

                const price = document.createElement("strong");

                const itemTotal = item.totalAmount != null
                    ? Number(item.totalAmount)
                    : Number(item.price || 0) *
                        (Number(item.quantity) || 1);

                price.textContent = formatPrice(itemTotal);

                row.append(name, price);
                card.appendChild(row);

                // Feedback appears only after delivery
                if (
                    String(order.status || "").toUpperCase() ===
                    "DELIVERED"
                ) {
                    try {
                        await addProductFeedbackForm(order, item, card);
                    } catch (error) {
                        console.error(
                            "Feedback form error:",
                            error
                        );
                    }
                }
            }

            // Total amount
            const total = document.createElement("p");
            total.className = "order-total";
            total.textContent =
                "Total Amount: " +
                formatPrice(order.totalAmount ?? order.total);

            card.appendChild(total);

            // Payment method
            const methodNames = {
                COD: "Cash on Delivery (COD)",
                UPI: "UPI Payment",
                Card: "Credit / Debit Card",
                "Net Banking": "Net Banking",
                Wallet: "Wallet"
            };

            const payment = document.createElement("p");
            payment.className = "order-payment";
            payment.textContent =
                "Payment Method: " +
                (methodNames[order.paymentMethod] ||
                    order.paymentMethod ||
                    "Not available");

            card.appendChild(payment);

            // Cancel Order
            if (!isCancelled(order.status)) {
                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Cancel Order";
                cancelButton.className = "cancel-order-btn";

                cancelButton.addEventListener("click", () =>
                    cancelOrder(order, cancelButton)
                );

                card.appendChild(cancelButton);
            }

            // Buy Again
            const reorderButton = document.createElement("button");
            reorderButton.textContent = "Buy Again";
            reorderButton.className = "reorder-btn";

            reorderButton.addEventListener("click", () =>
                buyAgain(order, reorderButton)
            );

            card.appendChild(reorderButton);
            ordersContainer.appendChild(card);
        }

    } catch (error) {
        console.error("Load orders error:", error);

        ordersContainer.innerHTML = `
            <section class="order-empty">
                <h3>Orders load झाले नाहीत</h3>
                <p>Backend चालू आहे का ते तपासा आणि पुन्हा प्रयत्न करा.</p>
                <button class="primary-btn" id="retryOrders">
                    Retry
                </button>
            </section>
        `;

        document.getElementById("retryOrders")?.addEventListener(
            "click",
            renderOrders
        );
    }
}

// Load orders when the page opens
renderOrders();

// Refresh order status every 5 seconds
setInterval(() => {
    renderOrders();
}, 5000);