export async function fetchRatings(
  apiEndpoint,
  productId,
  shopName,
  displayRatings,
) {
  try {
    const response = await fetch(
      `${apiEndpoint}/api/ratings?productId=${productId}&shopName=${shopName}`,
    );
    const data = await response.json();

    if (data.totalReviews) {
      displayRatings(data.totalReviews, data.ratingsDistribution);
    }
  } catch (error) {
    console.error("Error fetching ratings:", error);
  }
}

export function displayRatings(totalReviews, ratingsDistribution) {
  const globalRatings = document.getElementById("global-ratings");
  globalRatings.innerHTML = `
      <p><strong>Overall Reviews:</strong> ${totalReviews}</p>
      <button id="show-all-reviews" class="filter-button">Show All Reviews</button>
      <div class="ratings-distribution">
        ${ratingsDistribution
          .map(
            (rating, index) => `
          <div class="rating-row" data-rating="${5 - index}">
            <span class="star-count">${5 - index} stars:</span>
            <div class="progress-bar-container">
              <div class="progress-bar" data-percentage="${rating.percentage}"></div>
            </div>
            <span class="percentage">${rating.count} (${rating.percentage}%)</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  // Additional event listeners for ratings rows
}
