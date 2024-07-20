import { getDownloadURL, ref, uploadBytes } from "@firebase/storage";
import { isFeatureEnabled } from "./isFeatureEnabled";

export async function handleMedia(
  formData,
  settings,
  storage,
  subscriptionPlan,
) {
  let imageUrl = null;
  let videoUrl = null;

  const mediaEnabled = isFeatureEnabled(subscriptionPlan, "Images or Video");

  if (mediaEnabled) {
    const imageFile = formData.get("image");
    const videoFile = formData.get("video");

    if (settings.allowMedia) {
      if (imageFile && imageFile.size > 0) {
        const imageRef = ref(storage, `images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (videoFile && videoFile.size > 0) {
        const videoRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }
    }
  }

  return { imageUrl, videoUrl };
}
