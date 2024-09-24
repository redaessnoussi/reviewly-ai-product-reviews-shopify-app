export async function fetchSettings(apiEndpoint, shopName) {
  try {
    const settingsResponse = await fetch(
      `${apiEndpoint}/api/settings?shopName=${shopName}`,
    );
    return await settingsResponse.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}
