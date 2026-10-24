const offers = [
    {
        type: "UPI OFFER",
        title: "ShopEase UPI Deal",
        discount: "5% OFF",
        description: "Demo offer on eligible UPI payments.",
        condition: "Illustrative offer. Demo only."
    },
    {
        type: "CARD OFFER",
        title: "Credit / Debit Card Deal",
        discount: "7% OFF",
        description: "Demo offer on eligible card payments.",
        condition: "Illustrative offer. Demo only."
    },
    {
        type: "NET BANKING",
        title: "Net Banking Deal",
        discount: "5% OFF",
        description: "Demo savings on net banking payments.",
        condition: "Illustrative offer. Demo only."
    },
    {
        type: "WALLET OFFER",
        title: "Wallet Special",
        discount: "5% OFF",
        description: "Demo offer on eligible wallet payments.",
        condition: "Illustrative offer. Demo only."
    },
    {
        type: "FESTIVE DEAL",
        title: "Special Shopping Deal",
        discount: "Special Deal",
        description: "Explore products across ShopEase categories.",
        condition: "Promotional demo. No real discount processed."
    },
    {
        type: "COD",
        title: "Cash on Delivery",
        discount: "No Payment Discount",
        description: "Choose COD if you prefer paying on delivery.",
        condition: "Online-payment discount does not apply."
    }
];

const offersGrid = document.getElementById("offersGrid");

if (offersGrid) {
    offersGrid.innerHTML = offers.map(offer => `
        <article class="offer-card">
            <span class="offer-type">${offer.type}</span>
            <h3>${offer.title}</h3>
            <div class="offer-discount">${offer.discount}</div>
            <p>${offer.description}</p>
            <p class="offer-condition">${offer.condition}</p>
        </article>
    `).join("");
}