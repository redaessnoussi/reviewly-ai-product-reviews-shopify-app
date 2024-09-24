import { capitalizeFirstLetter } from "./utils";

export async function fetchReviews(
  apiEndpoint,
  productId,
  shopName,
  displayReviews,
) {
  try {
    const response = await fetch(
      `${apiEndpoint}/api/reviews?productId=${productId}&shopName=${shopName}`,
    );
    const reviews = await response.json();
    displayReviews(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }
}

export function displayReviews(reviews) {
  const reviewsList = document.getElementById("reviews-list");
  reviewsList.innerHTML = "";

  if (reviews.length === 0) {
    reviewsList.innerHTML = "<p>No reviews found.</p>";
  } else {
    reviews.forEach((review) => {
      const reviewElement = document.createElement("div");
      reviewElement.className = "review-box";
      const reviewDate = new Date(review.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      reviewElement.innerHTML = `
          <div class="review-header">
            <div class="avatar-container">
              <img src="https://via.placeholder.com/48" alt="Customer Avatar" class="avatar">
            </div>
            <div class="review-info">
              <p class="reviewer-name">${review.firstName} ${review.lastName ? review.lastName : ""}</p>
              ${generateStarRating(review.rating)}
              <p class="review-date">Reviewed on ${reviewDate}</p>
            </div>
          </div>
          <div class="review-content">
            ${review.imageUrl ? `<img src="${review.imageUrl}" alt="Review Image" class="review-image" />` : ""}
            ${review.videoUrl ? `<video src="${review.videoUrl}" controls class="review-video"></video>` : ""}
            <p class="review-comment">${review.comment}</p>
            ${review.sentiment ? `<span class="sentiment-badge ${review.sentiment.toLowerCase()}">${capitalizeFirstLetter(review.sentiment)}</span>` : ""}
          </div>
        `;
      reviewsList.appendChild(reviewElement);
    });
  }
}

function generateStarRating(rating) {
  return `
      <div class="star-rating" data-rating="${rating}">
        ${Array(5)
          .fill()
          .map((_, i) => `<span class="star" data-rating="${i + 1}">★</span>`)
          .join("")}
      </div>
    `;
}
