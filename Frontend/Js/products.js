
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

const productGrid = document.getElementById("productsContainer");

const params = new URLSearchParams(window.location.search);
const requestedCategory = params.get("category");

const aliases = {
    home: "Home & Kitchen",
    appliances: "Home & Kitchen"
};

const category = requestedCategory
    ? (aliases[requestedCategory.toLowerCase()] || requestedCategory)
        .trim().toLowerCase()
    : "";

const filteredProducts = category
    ? products.filter(p => p.category.toLowerCase() === category)
    : products;

function formatPrice(price) {
    return "₹" + price.toLocaleString("en-IN");
}
function getDiscountPercent(price, oldPrice) {
    if (!oldPrice || oldPrice <= price) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
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


async function addToCart(product) {
    let user;

    try {
        user = JSON.parse(localStorage.getItem("shopease_user") || "null");
    } catch {
        user = null;
    }

    if (
        localStorage.getItem("shopease_logged_in") !== "true" ||
        !user?.email
    ) {
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
            throw new Error(result.message || "Unable to add product.");
        }

        window.location.href = "cart.html";

    } catch (error) {
        alert("Cart error: " + error.message);
        console.error(error);
    }
}

if (productGrid) {
    productGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
        productGrid.textContent = "No products available in this category.";
    }

    filteredProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>

            <p class="product-category">${product.category}</p>
            <h3>${product.name}</h3>
            <p class="rating">★ ${product.rating} / 5</p>

            <p class="price">
                ${formatPrice(product.price)}
                <span class="old-price">${formatPrice(product.oldPrice)}</span>
            </p>

            <p class="delivery">
                Estimated delivery: ${getDeliveryEstimate()}
            </p>

            <div class="product-actions">
                <a class="view-btn"
                   href="product-details.html?id=${product.id}">
                   Details
                </a>

                <button class="add-btn" type="button">
                    Add to Cart
                </button>
            </div>
        `;

        card.querySelector(".add-btn").addEventListener("click", () => {
            addToCart(product);
        });

        productGrid.appendChild(card);
    });
}
