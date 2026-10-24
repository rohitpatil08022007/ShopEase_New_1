
const API_URL = "http://localhost:8080/api/cart";

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function getUserEmail() {
    try {
        const user = JSON.parse(localStorage.getItem("shopease_user") || "null");
        if (localStorage.getItem("shopease_logged_in") !== "true" || !user?.email) {
            return null;
        }
        return user.email;
    } catch {
        return null;
    }
}

const cartProductImages = {
    1: "/Frontend/images/mobile.jpg",
    2: "/Frontend/images/laptop.jpg",
    3: "/Frontend/images/watch.jpg",
    4: "/Frontend/images/shoes.jpg",
    5: "/Frontend/images/headphones.jpg",
    6: "/Frontend/images/travelBackpack.jpg",
    7: "/Frontend/images/mixerGrinder.jpg",
    8: "/Frontend/images/speaker.jpg",
    9: "/Frontend/images/facewash.jpg",
    10: "/Frontend/images/bat.jpg",
    11: "/Frontend/images/fashion.jpg",
    12: "/Frontend/images/grocery.jpg"
};

function formatPrice(price) {
    return "₹" + Number(price || 0).toLocaleString("en-IN");
}

async function apiRequest(url, options = {}) {
    const email = getUserEmail();

    if (!email) {
        window.location.href = "login.html";
        throw new Error("Please login first.");
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-User-Email": email,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Cart request failed.");
    }

    return data;
}

async function renderCart() {
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = "<p>Loading cart...</p>";

    try {
        const cart = await apiRequest(API_URL);

        cartItems.innerHTML = "";

        if (!Array.isArray(cart) || cart.length === 0) {
            cartItems.innerHTML = `
                <div class="product-card">
                    <h3>Your cart is empty!</h3>
                    <p>Add products to your cart to see them here.</p>
                    <a class="primary-btn" href="products.html">Shop Now</a>
                </div>`;
            cartTotal.textContent = "Total Amount: ₹0";
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const quantity = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const id = Number(item.productId);
            total += price * quantity;

            const row = document.createElement("article");
            row.className = "product-card";
            row.style.marginBottom = "15px";

            const image = document.createElement("img");

            image.src = item.image || item.imageUrl || item.productImage || "";
            image.src = cartProductImages[id] || "";
            image.alt = item.productName;
            image.style.width = "120px";
            image.style.height = "120px";
            image.style.objectFit = "contain";
            image.style.display = image.src ? "block" : "none";

            const heading = document.createElement("h3");
            heading.textContent = item.productName;

            const priceText = document.createElement("p");
            priceText.textContent = "Price: " + formatPrice(price);

            const quantityText = document.createElement("p");
            quantityText.textContent = "Quantity: " + quantity;

            const subtotalText = document.createElement("p");
            subtotalText.textContent = "Subtotal: " + formatPrice(price * quantity);

            const actions = document.createElement("div");
            actions.className = "product-actions";

            [
                { action: "decrease", text: "−", className: "add-btn" },
                { action: "increase", text: "+", className: "add-btn" },
                { action: "remove", text: "Remove", className: "view-btn" }
            ].forEach(buttonInfo => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = buttonInfo.className;
                button.dataset.action = buttonInfo.action;
                button.dataset.id = String(id);
                button.textContent = buttonInfo.text;
                actions.appendChild(button);
            });

            row.append(image, heading, priceText, quantityText, subtotalText, actions);
            cartItems.appendChild(row);
        });

        cartTotal.textContent = "Total Amount: " + formatPrice(total);

    } catch (error) {
        cartItems.innerHTML = `<p>${error.message}</p>`;
        cartTotal.textContent = "Total Amount: ₹0";
    }
}

if (cartItems) {
    cartItems.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const id = Number(button.dataset.id);
        const action = button.dataset.action;

        button.disabled = true;

        try {
            if (action === "remove") {
                await apiRequest(`${API_URL}/remove/${id}`, {
                    method: "DELETE"
                });
            } else {
                const cart = await apiRequest(API_URL);
                const item = cart.find(product => Number(product.productId) === id);

                if (!item) {
                    await renderCart();
                    return;
                }

                if (action === "increase") {
                    await apiRequest(`${API_URL}/add`, {
                        method: "POST",
                        body: JSON.stringify({
                            productId: item.productId,
                            productName: item.productName,
                            price: item.price,
                            quantity: 1
                        })
                    });
                } else if (action === "decrease") {
                    if (item.quantity <= 1) {
                        await apiRequest(`${API_URL}/remove/${id}`, {
                            method: "DELETE"
                        });
                    } else {
                        await apiRequest(`${API_URL}/remove/${id}`, {
                            method: "DELETE"
                        });

                        await apiRequest(`${API_URL}/add`, {
                            method: "POST",
                            body: JSON.stringify({
                                productId: item.productId,
                                productName: item.productName,
                                price: item.price,
                                quantity: item.quantity - 1
                            })
                        });
                    }
                }
            }

            await renderCart();

        } catch (error) {
            alert(error.message);
        } finally {
            button.disabled = false;
        }
    });
}

function showEmptyCartPopup() {
    const existingPopup = document.getElementById("emptyCartPopup");

    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement("div");
    popup.id = "emptyCartPopup";

    popup.innerHTML = `
        <div class="empty-cart-box">
            <button class="empty-cart-close"
                    type="button"
                    aria-label="Go to Home">&times;</button>

            <div class="empty-cart-icon">🛒</div>

            <h2>Your Cart is Empty</h2>

            <p>Add some products to your cart before checkout.</p>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".empty-cart-close").addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
        try {
            const cart = await apiRequest(API_URL);

            if (!Array.isArray(cart) || cart.length === 0) {
                showEmptyCartPopup();
                return;
            }

            window.location.href = "checkout.html";

        } catch (error) {
            alert(error.message);
        }
    });
}

renderCart();
