export async function handleFormSubmission(
  apiEndpoint,
  formData,
  fetchReviews,
) {
  try {
    const response = await fetch(`${apiEndpoint}/api/reviews`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      document.getElementById("review-form").reset();
      await fetchReviews(); // Refresh the reviews list
    } else {
      console.error("Failed to submit review");
    }
  } catch (error) {
    console.error("Error submitting review:", error);
  }
}
