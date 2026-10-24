
const API_URL = "http://localhost:8080/api/website-feedback";

const feedbackForm = document.getElementById("feedbackForm");
const emailInput = document.getElementById("email");
const feedbackInput = document.getElementById("feedback");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitFeedbackBtn");
const feedbackList = document.getElementById("feedbackList");

// Load feedback from database
async function loadFeedback() {
    feedbackList.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = "Loading feedback...";
    feedbackList.appendChild(loading);

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load feedback");
        }

        const feedbacks = await response.json();
        feedbackList.replaceChildren();

        if (!feedbacks.length) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent =
                "No feedback yet. Be the first to share your experience!";
            feedbackList.appendChild(emptyMessage);
            return;
        }

        feedbacks.forEach((item) => {
            const card = document.createElement("article");
            card.className = "feedback-item";

            const email = document.createElement("h3");
            email.textContent = item.email;

            const feedbackText = document.createElement("p");
            feedbackText.textContent = item.feedback;

            const date = document.createElement("span");
            date.className = "feedback-date";

            if (item.createdAt) {
                const parsedDate = new Date(item.createdAt);
                date.textContent = Number.isNaN(parsedDate.getTime())
                    ? ""
                    : parsedDate.toLocaleString("en-IN");
            }

            card.append(email, feedbackText, date);
            feedbackList.appendChild(card);
        });
    } catch (error) {
        feedbackList.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            "Unable to load feedback. Please make sure the backend is running.";
        feedbackList.appendChild(errorMessage);

        console.error("Load feedback error:", error);
    }
}

// Submit feedback to database
feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const feedback = feedbackInput.value.trim();

    if (!email || !feedback) {
        message.textContent = "Please enter your email and feedback.";
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
            body: JSON.stringify({
                email: email,
                feedback: feedback
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Feedback submission failed."
            );
        }

        message.textContent = "Thank you! Your feedback was submitted.";
        feedbackForm.reset();

        await loadFeedback();
    } catch (error) {
        message.textContent =
            error.message || "Unable to submit feedback. Please try again.";
        console.error("Submit feedback error:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Feedback";
    }
});

// Display saved feedback when page opens
loadFeedback();
