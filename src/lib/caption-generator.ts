import { pipeline } from "@huggingface/transformers";

let captioner: any = null;

export async function initializeCaptioner() {
  if (captioner) return captioner;
  
  captioner = await pipeline(
    "image-to-text",
    "Xenova/vit-gpt2-image-captioning"
  );
  
  return captioner;
}

export async function generateCaption(imageUrl: string): Promise<string> {
  const model = await initializeCaptioner();
  const result = await model(imageUrl);
  return result[0].generated_text;
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
