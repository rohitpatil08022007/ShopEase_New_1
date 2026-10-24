
 // ShopEase Product Details

const products = [
    {
        id: 1,
        name: "i phone 18 Pro Max",
        category: "Mobiles",
        price: 164900,
        oldPrice: 179900,
        rating: 4.8,
        image: "images/mobile.jpg",
        description: "Explore this premium smartphone with a large display, powerful performance and advanced camera features."
    },
    {
        id: 2,
        name: "Gaming Laptop",
        category: "Electronics",
        price: 99900,
        oldPrice: 119900,
        rating: 4.6,
        image: "images/laptop.jpg",
        description: "A gaming laptop designed for gaming, multitasking, entertainment and demanding applications."
    },
    {
        id: 3,
        name: "Smart Watch",
        category: "Electronics",
        price: 1999,
        oldPrice: 2999,
        rating: 4.1,
        image: "images/watch.jpg",
        description: "A smart watch for everyday use with a modern design and convenient activity tracking features."
    },
    {
        id: 4,
        name: "Sneaker Shoes",
        category: "Fashion",
        price: 1499,
        oldPrice: 2499,
        rating: 4.2,
        image: "images/shoes.jpg",
        description: "Casual sneaker shoes suitable for everyday wear, walking and outings."
    },
    {
        id: 5,
        name: "Headphones",
        category: "Electronics",
        price: 1299,
        oldPrice: 1999,
        rating: 4.3,
        image: "images/headphones.jpg",
        description: "Enjoy music, videos and calls with these everyday headphones."
    },
    {
        id: 6,
        name: "Travel Backpack",
        category: "Fashion",
        price: 999,
        oldPrice: 1599,
        rating: 4.0,
        image: "images/travelBackpack.jpg",
        description: "A useful backpack for carrying everyday essentials while travelling or going to college."
    },
    {
        id: 7,
        name: "Mixer Grinder",
        category: "Home & Kitchen",
        price: 2499,
        oldPrice: 3299,
        rating: 4.2,
        image: "images/mixerGrinder.jpg",
        description: "A kitchen appliance for everyday mixing and grinding tasks."
    },
    {
        id: 8,
        name: "Bluetooth Speaker",
        category: "Electronics",
        price: 1799,
        oldPrice: 2499,
        rating: 4.3,
        image: "images/speaker.jpg",
        description: "A portable Bluetooth speaker for listening to music at home or on the go."
    },
    {
        id: 9,
        name: "Face Wash",
        category: "Beauty",
        price: 249,
        oldPrice: 349,
        rating: 4.1,
        image: "images/facewash.jpg",
        description: "A face wash product for your everyday skincare routine. Check the packaging for ingredients and usage instructions."
    },
    {
        id: 10,
        name: "Cricket Bat",
        category: "Sports",
        price: 899,
        oldPrice: 1299,
        rating: 4.0,
        image: "images/bat.jpg",
        description: "A cricket bat for practice sessions and casual cricket games."
    },
    {
        id: 11,
        name: "Electric Kettle",
        category: "Home & Kitchen",
        price: 799,
        oldPrice: 1199,
        rating: 4.2,
        image: "images/fashion.jpg",
        description: "An electric kettle for convenient everyday water heating."
    },
    {
        id: 12,
        name: "Grocery Pack",
        category: "Grocery",
        price: 499,
        oldPrice: 599,
        rating: 4.0,
        image: "images/grocery.jpg",
        description: "An everyday grocery pack. Check the product packaging for the actual contents and quantity."
    }
];

const CART_API_URL = "http://localhost:8080/api/cart";
const PRODUCT_FEEDBACK_API = "http://localhost:8080/api/product-feedback";

const productDetails = document.getElementById("productDetails");
const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

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

function renderProduct(product) {
    if (!productDetails) return;

    const discount = Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
    );

    productDetails.innerHTML = `
        <div class="details-image-box">
            <img
                src="${product.image}"
                alt="${product.name}"
                onerror="this.style.display='none';
                this.parentElement.innerHTML='<p class=&quot;image-fallback&quot;>Product image unavailable. Check the image file path.</p>';"
            >
        </div>

        <div class="details-info">
            <p class="details-category">${product.category}</p>
            <h1>${product.name}</h1>

            <p class="details-rating">
                ★ ${product.rating} / 5
            </p>

            <p class="details-price">
                ${formatPrice(product.price)}
                <span class="details-old-price">
                    ${formatPrice(product.oldPrice)}
                </span>
            </p>

            <p class="details-discount">${discount}% off</p>

            <p class="details-description">
                ${product.description}
            </p>

            <div class="delivery-info">
                <strong>Estimated Delivery</strong><br>
                Expected by ${getDeliveryEstimate()}<br>
                <small>Estimated date only. Actual delivery may vary.</small>
            </div>

            <div class="details-actions">
                <button type="button" class="add-to-cart-btn" id="addToCartBtn">
                    Add to Cart
                </button>

                <button type="button" class="buy-now-btn" id="buyNowBtn">
                    Buy Now
                </button>
            </div>

            <p id="detailsMessage" role="status"></p>
        </div>
    `;

    document.getElementById("addToCartBtn").addEventListener("click", function () {
        addToCart(product);
    });

    document.getElementById("buyNowBtn").addEventListener("click", async function () {
        const user = JSON.parse(
            localStorage.getItem("shopease_user") || "null"
        );

        if (
            localStorage.getItem("shopease_logged_in") !== "true" ||
            !user?.email
        ) {
            showLoginPopup();
            return;
        }

        await addToCart(product);

        const message = document.getElementById("detailsMessage");

        if (message && message.textContent === product.name + " added to cart!") {
            window.location.href = "checkout.html";
        }
    });
}


async function loadRealFeedback(product) {
    const reviewsList = document.getElementById("reviewsList");

    if (!reviewsList) return;

    reviewsList.innerHTML = "<p>Loading customer feedback...</p>";

    try {
        const response = await fetch(
            `${PRODUCT_FEEDBACK_API}/${product.id}`
        );

        if (!response.ok) {
            throw new Error("Could not load customer feedback.");
        }

        const feedbackList = await response.json();
        reviewsList.innerHTML = "";

        if (!Array.isArray(feedbackList) || feedbackList.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "no-feedback-message";
            emptyMessage.textContent = "No customer feedback yet.";
            reviewsList.appendChild(emptyMessage);
            return;
        }

        feedbackList.forEach(review => {
            const card = document.createElement("div");
            card.className = "review-card";

            const heading = document.createElement("h3");
            heading.textContent = review.userEmail || "Registered Customer";

            const rating = document.createElement("p");
            rating.className = "review-stars";
            rating.textContent = "Rating: " + review.rating + " / 5";

            const comment = document.createElement("p");
            comment.textContent = review.comment;

            const date = document.createElement("p");
            date.textContent = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString("en-IN")
                : "";

            card.append(heading, rating, comment, date);
            reviewsList.appendChild(card);
        });

    } catch (error) {
        reviewsList.innerHTML = "";

        const errorMessage = document.createElement("p");
        errorMessage.textContent = error.message;
        reviewsList.appendChild(errorMessage);
    }
}


function showLoginPopup() {
    let popup = document.getElementById("loginRequiredPopup");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "loginRequiredPopup";

        popup.innerHTML = `
            <div class="login-popup-box" role="dialog"
                 aria-modal="true" aria-labelledby="loginPopupTitle">
                <h2 id="loginPopupTitle">Please Login First</h2>
                <p>Please login to continue shopping.</p>

                <button type="button" id="loginPopupBtn">
                    Login
                </button>

                <button type="button" id="closeLoginPopupBtn">
                    Cancel
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById("loginPopupBtn").onclick = function () {
            window.location.href = "login.html";
        };

        document.getElementById("closeLoginPopupBtn").onclick = function () {
            popup.style.display = "none";
        };
    }

    popup.style.display = "flex";
}

async function addToCart(product) {
    const message = document.getElementById("detailsMessage");

    try {
        const user = JSON.parse(
            localStorage.getItem("shopease_user") || "null"
        );

        if (
            localStorage.getItem("shopease_logged_in") !== "true" ||
            !user?.email
        ) {
            showLoginPopup();
            return;
        }

        if (message) {
            message.textContent = "Adding product to cart...";
        }

        const response = await fetch(CART_API_URL + "/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Email": user.email
            },
            body: JSON.stringify({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: 1
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Could not add product to cart.");
        }

        if (message) {
            message.textContent = product.name + " added to cart!";
        }

    } catch (error) {
        if (message) {
            message.textContent = error.message || "Something went wrong.";
        }

        console.error("Add to Cart error:", error);
    }
}

// Display the selected product and its real feedback.
const selectedProduct = products.find(item => item.id === productId);

if (selectedProduct) {
    renderProduct(selectedProduct);
    loadRealFeedback(selectedProduct);
} else if (productDetails) {
    productDetails.innerHTML = `
        <div class="details-info">
            <h2>Product not found</h2>
            <p>Please return to the Home Page and select a product.</p>
            <a href="index.html">Back to Home</a>
        </div>
    `;
}
