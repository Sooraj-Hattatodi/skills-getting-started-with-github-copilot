document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
          </div>
        `;

        const participantsSection = activityCard.querySelector(".participants-section");
        const participantList = document.createElement("ul");
        const availability = activityCard.querySelector(".availability");

        const renderParticipants = () => {
          participantList.replaceChildren();

          if (!details.participants.length) {
            const emptyMessage = document.createElement("li");
            emptyMessage.className = "no-participants";
            emptyMessage.textContent = "No participants yet";
            participantList.appendChild(emptyMessage);
            return;
          }

          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            const participantName = document.createElement("span");
            const removeButton = document.createElement("button");

            participantName.textContent = participant;
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.setAttribute("aria-label", `Unregister ${participant}`);
            removeButton.title = "Unregister participant";
            removeButton.textContent = "×";

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants/${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                if (!response.ok) {
                  const result = await response.json();
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                details.participants.splice(details.participants.indexOf(participant), 1);
                availability.innerHTML = `<strong>Availability:</strong> ${
                  details.max_participants - details.participants.length
                } spots left`;
                renderParticipants();
              } catch (error) {
                removeButton.disabled = false;
                console.error("Error unregistering participant:", error);
              }
            });

            participantItem.append(participantName, removeButton);
            participantList.appendChild(participantItem);
          });
        };

        participantsSection.appendChild(participantList);
        renderParticipants();

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
