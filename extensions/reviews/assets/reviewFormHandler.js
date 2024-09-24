document.addEventListener("DOMContentLoaded", async function () {
  const shopName = document.getElementById("shop-name").value;
  const productId = document.getElementById("product-id").value;

  const starRating = document.querySelector(".star-rating");
  const stars = starRating.querySelectorAll(".star");
  const ratingInput = document.getElementById("rating");

  starRating.addEventListener("click", function (e) {
    if (e.target.classList.contains("star")) {
      const rating = e.target.getAttribute("data-rating");
      ratingInput.value = rating;
      starRating.setAttribute("data-rating", rating);
    }
  });

  // Submit review form
  document
    .getElementById("review-form")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      const loading = document.getElementById("loading");
      loading.style.display = "block";

      const formData = new FormData(this);
      formData.append("productId", document.getElementById("product-id").value);
      formData.append("shopName", document.getElementById("shop-name").value);

      await fetch(`${apiEndpoint}/api/reviews`, {
        method: "POST",
        body: formData,
      });

      loading.style.display = "none";
      document.getElementById("review-form").reset();
    });
});
