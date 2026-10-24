const API_URL = "http://localhost:8080/api/products";
const products = [
    { id: 1, name: "i phone 18 Pro Max", category: "Mobiles", price: 164900, oldPrice: 179900, rating: 4.8, image: "images/mobile.jpg" },
    { id: 2, name: "Gaming Laptop", category: "Electronics", price: 99900, oldPrice: 119900, rating: 4.6, image: "images/laptop.jpg" },
    { id: 3, name: "Smart Watch", category: "Electronics", price: 1999, oldPrice: 2999, rating: 4.1, image: "images/watch.jpg" },
    { id: 4, name: "Sneaker Shoes", category: "Fashion", price: 1499, oldPrice: 2499, rating: 4.2, image: "images/shoes.jpg" },
    { id: 5, name: "Headphones", category: "Electronics", price: 1299, oldPrice: 1999, rating: 4.3, image: "images/headphones.jpg" },
    { id: 6, name: "Travel Backpack", category: "Fashion", price: 999, oldPrice: 1599, rating: 4.0, image: "images/travelBackpack.jpg" },
    { id: 7, name: "Mixer Grinder", category: "Home & Kitchen", price: 2499, oldPrice: 3299, rating: 4.2, image: "images/mixerGrinder.jpg" },
    { id: 8, name: "Bluetooth Speaker", category: "Electronics", price: 1799, oldPrice: 2499, rating: 4.3, image: "images/speaker.jpg" },
    { id: 9, name: "Face Wash", category: "Beauty", price: 249, oldPrice: 349, rating: 4.1, image: "images/facewash.jpg" },
    { id: 10, name: "Cricket Bat", category: "Sports", price: 899, oldPrice: 1299, rating: 4.0, image: "images/bat.jpg" },
    { id: 11, name: "Electric Kettle", category: "Home & Kitchen", price: 799, oldPrice: 1199, rating: 4.2, image: "images/fashion.jpg" },
    { id: 12, name: "Grocery Pack", category: "Grocery", price: 499, oldPrice: 599, rating: 4.0, image: "images/grocery.jpg" }
];

const productGrid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchMessage = document.getElementById("searchMessage");

const CART_KEY = "shopease_demo_cart";

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const count = getCart().reduce((total, item) => total + item.quantity, 0);
    if (cartCount) cartCount.textContent = count;
}

function formatPrice(price) {
    return "₹" + price.toLocaleString("en-IN");
}

function getDeliveryEstimate() {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function renderProducts(list) {
    if (!productGrid) return;

    productGrid.innerHTML = "";

    if (list.length === 0) {
        productGrid.innerHTML = "<p>No matching products found.</p>";
        return;
    }

    list.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}"
                     alt="${product.name}"
                     onerror="this.alt='Image unavailable';">
            </div>
            <p class="product-category">${product.category}</p>
            <h3>${product.name}</h3>
            <p class="rating">★ ${product.rating} / 5</p>
            <p class="price">
                ${formatPrice(product.price)}
                <span class="old-price">${formatPrice(product.oldPrice)}</span>
            </p>
            <p class="delivery">Estimated delivery: ${getDeliveryEstimate()}</p>
            <div class="product-actions">
                <a class="view-btn" href="product-details.html?id=${product.id}">Details</a>
                <button class="add-btn" type="button" data-add-to-cart="${product.id}">
                    Add to Cart
                </button>
            </div>
        `;

        productGrid.appendChild(card);
    });
}


async function addToCart(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));
    if (!product) return;

    const loggedIn = localStorage.getItem("shopease_logged_in") === "true";

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("shopease_user") || "null");
    } catch {
        user = null;
    }

    if (!loggedIn || !user?.email) {
        alert("Please login first to add products to your cart.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/api/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": user.email
            },
            body: JSON.stringify({
                productId: Number(product.id),
                productName: product.name,
                price: Number(product.price),
                quantity: 1
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not add product.");
        }

        window.location.href = "cart.html";

    } catch (error) {
        alert("Cart API error: " + error.message);
        console.error(error);
    }
}

if (productGrid) {
    productGrid.addEventListener("click", event => {
        const button = event.target.closest("[data-add-to-cart]");
        if (button) addToCart(Number(button.dataset.addToCart));
    });
}

if (searchForm && searchInput) {
    searchForm.addEventListener("submit", event => {
        event.preventDefault();

        const query = searchInput.value.trim().toLowerCase();
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)
        );

        renderProducts(filtered);

        if (searchMessage) {
            searchMessage.textContent = query
                ? `${filtered.length} product(s) found.`
                : "Showing all products.";
        }
    });
}

updateCartCount();


async function loadProductsFromBackend() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Backend API failed");
        }

        const backendProducts = await response.json();

        if (Array.isArray(backendProducts) && backendProducts.length > 0) {
            products.length = 0;
            products.push(...backendProducts);
        }

        renderProducts(products);
        console.log("Products loaded:", products);

    } catch (error) {
        console.error("Backend connection failed:", error);
        renderProducts(products);
    }
}

loadProductsFromBackend();



const loginLink = document.getElementById("loginLink");
const logoutBtn = document.getElementById("logoutBtn");
const profileLink = document.getElementById("profileLink");

function updateAuthLinks() {
    const loggedIn =
        localStorage.getItem("shopease_logged_in") === "true";

    if (loginLink) {
        loginLink.style.display = loggedIn ? "" : "none";
    }

    if (logoutBtn) {
        logoutBtn.style.display = loggedIn ? "" : "none";
    }

    if (profileLink) {
        profileLink.style.display = loggedIn ? "" : "none";
    }
}

updateAuthLinks();
window.addEventListener("storage", updateAuthLinks);



function showLogoutPopup() {
    let popup = document.getElementById("logoutConfirmPopup");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "logoutConfirmPopup";

        popup.innerHTML = `
            <div class="logout-popup-box" role="dialog"
                 aria-modal="true" aria-labelledby="logoutPopupTitle">
                <div class="logout-popup-icon">↪</div>
                <h2 id="logoutPopupTitle">Confirm Logout</h2>
                <p>Are you sure you want to logout?</p>

                <div class="logout-popup-actions">
                    <button type="button" id="confirmLogoutBtn">
                        Yes, Logout
                    </button>
                    <button type="button" id="cancelLogoutBtn">
                        No, Stay
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById("confirmLogoutBtn").addEventListener("click", function () {
            localStorage.removeItem("shopease_logged_in");
            localStorage.removeItem("shopease_user");

            window.location.href = "index.html";
        });

        document.getElementById("cancelLogoutBtn").addEventListener("click", function () {
            popup.style.display = "none";
        });
    }

    popup.style.display = "flex";
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", function (event) {
        event.preventDefault();
        showLogoutPopup();
    });
}

