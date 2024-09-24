export function setupStarRating() {
  const starRating = document.querySelector(".star-rating");
  const ratingInput = document.getElementById("rating");

  starRating.addEventListener("click", function (e) {
    if (e.target.classList.contains("star")) {
      const rating = e.target.getAttribute("data-rating");
      ratingInput.value = rating;
      starRating.setAttribute("data-rating", rating);
    }
  });

  starRating.addEventListener("mouseover", function (e) {
    if (e.target.classList.contains("star")) {
      const rating = e.target.getAttribute("data-rating");
      starRating.setAttribute("data-rating", rating);
    }
  });

  starRating.addEventListener("mouseout", function () {
    starRating.setAttribute("data-rating", ratingInput.value || "0");
  });
}
