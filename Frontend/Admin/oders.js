
const API_BASE = "http://localhost:8080/api/orders/admin/all";

const ordersContainer = document.getElementById("adminOrdersContainer");
const messageElement = document.getElementById("adminMessage");

let allOrders = [];

const statusLabels = {
    PLACED: "Order Placed",
    PACKED: "Packed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Order Cancelled"
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getStatus(order) {
    const status = String(order.status || "PLACED").toUpperCase();

    const oldStatusMap = {
        "ORDER PLACED": "PLACED",
        "ORDER PLACED (DEMO)": "PLACED",
        "ORDER CANCELLED": "CANCELLED"
    };

    return oldStatusMap[status] || status;
}

function getCustomerName(order) {
    return order.customerName || order.customer?.name || "Not available";
}

function getOrderTotal(order) {
    return Number(order.totalAmount ?? order.total ?? 0) || 0;
}

function getOrderDate(order) {
    if (!order.orderDate) return null;

    const date = new Date(order.orderDate);
    return Number.isNaN(date.getTime()) ? null : date;
}

function showMessage(message, type = "") {
    messageElement.textContent = message;
    messageElement.className = "admin-message " + type;
}

async function loadOrders() {
    ordersContainer.innerHTML = "<p>Loading orders...</p>";
    showMessage("");

    try {
        const adminEmail = localStorage.getItem("shopease_admin_email");

        if (!adminEmail) {
            ordersContainer.innerHTML =
                "<p>Please login through the Admin Login page first.</p>";
            showMessage("Admin login required.", "error");
            return;
        }

        const response = await fetch(API_BASE, {
            method: "GET",
            headers: {
                "X-Admin-Email": adminEmail
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                "HTTP " + response.status + ": " + errorText
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected response from the server.");
        }

        allOrders = data;
        updateDashboard();
        renderOrders();
    } catch (error) {
        allOrders = [];
        updateDashboard();

        ordersContainer.innerHTML = "<p>Orders could not be loaded.</p>";
        showMessage(
            error.message || "Backend connection failed.",
            "error"
        );
    }
}

function updateDashboard() {
    document.getElementById("totalOrders").textContent = allOrders.length;

    document.getElementById("shippedOrders").textContent =
        allOrders.filter(order => getStatus(order) === "SHIPPED").length;

    document.getElementById("deliveredOrders").textContent =
        allOrders.filter(order => getStatus(order) === "DELIVERED").length;

    document.getElementById("cancelledOrders").textContent =
        allOrders.filter(order => getStatus(order) === "CANCELLED").length;

    const totalValue = allOrders
        .filter(order => getStatus(order) !== "CANCELLED")
        .reduce((sum, order) => sum + getOrderTotal(order), 0);

    document.getElementById("totalOrderValue").textContent =
        "₹" + totalValue.toLocaleString("en-IN");
}

function renderOrders() {
    const searchText = document.getElementById("orderSearch")
        .value.trim().toLowerCase();

    const selectedStatus = document.getElementById("statusFilter").value;
    const selectedDate = document.getElementById("orderDateFilter").value;

    const filteredOrders = allOrders.filter(order => {
        const id = String(order.orderId ?? order.id ?? "").toLowerCase();
        const name = getCustomerName(order).toLowerCase();
        const status = getStatus(order);
        const date = getOrderDate(order);

        const matchesSearch =
            id.includes(searchText) || name.includes(searchText);

        const matchesStatus =
            selectedStatus === "All" || status === selectedStatus;

        const matchesDate =
            !selectedDate ||
            (date && [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-") === selectedDate);

        return matchesSearch && matchesStatus && matchesDate;
    });

    ordersContainer.innerHTML = "";

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = "<p>No matching orders found.</p>";
        return;
    }

    filteredOrders
        .slice()
        .sort((a, b) => Number(b.orderId ?? b.id) - Number(a.orderId ?? a.id))
        .forEach(order => {
            const card = document.createElement("section");
            card.className = "admin-order-card";

            const orderId = order.orderId ?? order.id;
            const status = getStatus(order);
            const date = getOrderDate(order);
            const customerName = getCustomerName(order);
            const total = getOrderTotal(order);

            const heading = document.createElement("h3");
            heading.textContent = "Order #" + orderId;
            card.appendChild(heading);

            const details = document.createElement("p");
            details.textContent =
                "Order Date: " + (date ? date.toLocaleString("en-IN") : "Not available");
            card.appendChild(details);

            const customer = document.createElement("p");
            customer.textContent = "Customer: " + customerName;
            card.appendChild(customer);

            const product = document.createElement("p");
            product.textContent =
                "Product: " + (order.productName || "Not available") +
                " × " + (Number(order.quantity) || 1);
            card.appendChild(product);

            const amount = document.createElement("p");
            amount.textContent = "Total: ₹" + total.toLocaleString("en-IN");
            card.appendChild(amount);

            const currentStatus = document.createElement("p");
            currentStatus.textContent =
                "Current Status: " + (statusLabels[status] || status);
            card.appendChild(currentStatus);

            const label = document.createElement("label");
            label.textContent = "Update Status: ";
            label.htmlFor = "status-" + orderId;
            card.appendChild(label);

            const select = document.createElement("select");
            select.className = "admin-status-select";
            select.id = "status-" + orderId;

            Object.entries(statusLabels).forEach(([value, text]) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = text;
                option.selected = value === status;
                select.appendChild(option);
            });

            card.appendChild(select);

            const updateButton = document.createElement("button");
            updateButton.type = "button";
            updateButton.className = "admin-update-btn";
            updateButton.textContent = "Update Status";

            updateButton.addEventListener("click", () => {
                updateOrderStatus(orderId, select.value, updateButton);
            });

            card.appendChild(updateButton);

            const detailsButton = document.createElement("button");
            detailsButton.type = "button";
            detailsButton.className = "admin-update-btn";
            detailsButton.textContent = "View Details";
            detailsButton.addEventListener("click", () => showOrderDetails(order));
            card.appendChild(detailsButton);

            ordersContainer.appendChild(card);
        });
}

async function updateOrderStatus(orderId, status, button) {
    const adminEmail = localStorage.getItem("shopease_admin_email");

    if (!adminEmail) {
        showMessage("Please login through Admin Login first.", "error");
        return;
    }

    button.disabled = true;
    showMessage("Updating order status...");

    try {
        const response = await fetch(
            `http://localhost:8080/api/orders/admin/${encodeURIComponent(orderId)}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-Email": adminEmail
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Order status update failed.");
        }

        showMessage("Order status updated successfully.", "success");
        await loadOrders();
    } catch (error) {
        showMessage(error.message || "Could not update status.", "error");
    } finally {
        button.disabled = false;
    }
}

function showOrderDetails(order) {
    const overlay = document.createElement("div");
    overlay.className = "order-modal-overlay";

    const date = getOrderDate(order);
    const status = getStatus(order);

    overlay.innerHTML = `
        <section class="order-modal" role="dialog" aria-modal="true"
                 aria-label="Order Details">
            <div class="modal-header">
                <h2>Order Details</h2>
                <button class="modal-close" type="button"
                        aria-label="Close details">×</button>
            </div>

            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> ${escapeHTML(order.orderId ?? order.id ?? "N/A")}</p>
            <p><strong>Order Date:</strong> ${escapeHTML(date ? date.toLocaleString("en-IN") : "N/A")}</p>
            <p><strong>Status:</strong> ${escapeHTML(statusLabels[status] || status)}</p>

            <h3>Customer Details</h3>
            <p><strong>Name:</strong> ${escapeHTML(getCustomerName(order))}</p>
            <p><strong>Email:</strong> ${escapeHTML(order.customerEmail || "N/A")}</p>
            <p><strong>Phone:</strong> ${escapeHTML(order.customerMobile || "N/A")}</p>
            <p><strong>Address:</strong> ${escapeHTML(order.deliveryAddress || "N/A")}</p>
            <p><strong>City:</strong> ${escapeHTML(order.deliveryCity || "N/A")}</p>
            <p><strong>Pincode:</strong> ${escapeHTML(order.deliveryPincode || "N/A")}</p>

            <h3>Product Details</h3>
            <p>${escapeHTML(order.productName || "N/A")} × ${Number(order.quantity) || 1}</p>

            <h3>Payment Details</h3>
            <p><strong>Method:</strong> ${escapeHTML(order.paymentMethod || "N/A")}</p>
            <p class="modal-total"><strong>Total:</strong> ₹${getOrderTotal(order).toLocaleString("en-IN")}</p>
        </section>
    `;

    document.body.appendChild(overlay);

    function closeModal() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") closeModal();
    }

    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });
    document.addEventListener("keydown", handleEscape);
}

document.getElementById("orderSearch").addEventListener("input", renderOrders);
document.getElementById("statusFilter").addEventListener("change", renderOrders);
document.getElementById("orderDateFilter").addEventListener("change", renderOrders);

document.getElementById("clearFilters").addEventListener("click", () => {
    document.getElementById("orderSearch").value = "";
    document.getElementById("statusFilter").value = "All";
    document.getElementById("orderDateFilter").value = "";
    renderOrders();
});

loadOrders();
