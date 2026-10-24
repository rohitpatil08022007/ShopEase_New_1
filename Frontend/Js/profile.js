const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMobile = document.getElementById("profileMobile");
const logoutBtn = document.getElementById("logoutBtn");
const profileMessage = document.getElementById("profileMessage");

// Read demo registration data from localStorage
const registeredUser = JSON.parse(
    localStorage.getItem("shopease_user") || "null"
);

if (registeredUser) {
    profileName.textContent =
        registeredUser.name || registeredUser.fullName || "Not available";

    profileEmail.textContent =
        registeredUser.email || "Not available";

    profileMobile.textContent =
        registeredUser.mobile || registeredUser.phone || "Not available";
}



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

        popup.querySelector("#confirmLogoutBtn").addEventListener("click", function () {
            localStorage.removeItem("shopease_logged_in");
            localStorage.removeItem("shopease_user");
            sessionStorage.clear();

            window.location.href = "index.html";
        });

        popup.querySelector("#cancelLogoutBtn").addEventListener("click", function () {
            popup.style.display = "none";
        });
    }

    popup.style.display = "flex";
}

logoutBtn.addEventListener("click", function (event) {
    event.preventDefault();
    showLogoutPopup();
});


