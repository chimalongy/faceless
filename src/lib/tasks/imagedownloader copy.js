import axios from "axios";
import { supabase } from "../../lib/supabase";

export async function downloadandUploadImageToSupabase(
  sceneNumber,
  destinationPath,
  prompt,
  logger
) {
  const bucketName = process.env.SUPABASE_BUCKET;
  const makePublic = true;
  const contentType = "image/jpeg";

  logger.info(`Generating image for scene: ${sceneNumber}`);
  logger.info(`Prompt: ${prompt}`);

  try {
    // 1️⃣ Call your Cloudflare Worker (Flux 2 Dev)
    const response = await axios.post(
      "https://my-worker.me-chimaobi.workers.dev/",
      { prompt }, // no references
      {
        headers: {
          Authorization: `Bearer FACELESSSTUDIO`, // your worker API key
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // important for binary image
        timeout: 90000,
      }
    );

    // Convert raw bytes → Buffer for Supabase
    const buffer = Buffer.from(response.data);

    // 2️⃣ Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(destinationPath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;
    if (!data || !data.path) throw new Error("Supabase upload failed, no path returned");

    // 3️⃣ Return public URL
    if (makePublic) {
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      if (!publicData?.publicUrl) throw new Error("Failed to get public URL");

      logger.info(`Image uploaded successfully: ${publicData.publicUrl}`);
      return {
        success: true,
        scene: sceneNumber,
        path: data.path,
        url: publicData.publicUrl,
      };
    } else {
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(data.path, 60 * 60);

      if (signedErr) throw signedErr;
      return {
        success: true,
        scene: sceneNumber,
        path: data.path,
        url: signedData.signedUrl,
      };
    }
  } catch (err) {
    logger.error(`Image generation/upload failed for scene ${sceneNumber}: ${err.message}`);
    return {
      success: false,
      scene: sceneNumber,
      error: err.message,
      url: null,
    };
  }
}
