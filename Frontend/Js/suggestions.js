
const API_URL = "http://localhost:8080/api/website-suggestions";

const suggestionForm = document.getElementById("suggestionForm");
const emailInput = document.getElementById("email");
const suggestionInput = document.getElementById("suggestion");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitSuggestionBtn");
const suggestionList = document.getElementById("suggestionList");

// Display suggestions
async function loadSuggestions() {
    suggestionList.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading suggestions...";
    suggestionList.appendChild(loading);

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load suggestions.");
        }

        const suggestions = await response.json();
        suggestionList.replaceChildren();

        if (suggestions.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No suggestions yet. Be the first to share an idea!";
            suggestionList.appendChild(emptyMessage);
            return;
        }

        suggestions.forEach((item) => {
            const card = document.createElement("article");
            card.className = "suggestion-item";

            const email = document.createElement("h3");
            email.textContent = item.email;

            const suggestionText = document.createElement("p");
            suggestionText.textContent = item.suggestion;

            const date = document.createElement("small");
            date.className = "suggestion-date";
            date.textContent = item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Recently submitted";

            card.append(email, suggestionText, date);
            suggestionList.appendChild(card);
        });
    } catch (error) {
        suggestionList.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            "Unable to load suggestions. Please check whether the backend is running.";
        suggestionList.appendChild(errorMessage);

        console.error(error);
    }
}

// Submit a new suggestion
suggestionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const suggestion = suggestionInput.value.trim();

    if (!email || !suggestion) {
        message.textContent = "Please fill in all fields.";
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    message.textContent = "";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, suggestion })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to submit suggestion.");
        }

        message.textContent = "Suggestion submitted successfully!";
        suggestionForm.reset();

        await loadSuggestions();
    } catch (error) {
        message.textContent =
            error.message || "Unable to submit suggestion. Please try again.";
        console.error(error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Suggestion";
    }
});

// Load existing suggestions when the page opens
loadSuggestions();
