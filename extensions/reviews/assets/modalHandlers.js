export function setupModalHandlers() {
  document.querySelectorAll(".js-modal-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modal = document.getElementById(trigger.dataset.target);
      modal.classList.add("is-active");
    });
  });

  document.querySelectorAll(".modal-close").forEach((closeButton) => {
    closeButton.addEventListener("click", () => {
      document.getElementById("open-modal").classList.remove("is-active");
    });
  });
}
