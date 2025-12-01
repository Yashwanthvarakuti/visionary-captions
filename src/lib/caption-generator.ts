export async function generateCaption(imageFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.isLoading) {
      throw new Error('Model is loading, please try again in a moment');
    }
    throw new Error(errorData.error || 'Failed to generate caption');
  }

  const data = await response.json();
  return data.caption;
}

export async function extractVideoFrame(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(2, video.duration / 2); // Seek to 2 seconds or middle
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };

    video.onerror = () => reject(new Error("Error loading video"));
    video.src = URL.createObjectURL(videoFile);
  });
}
