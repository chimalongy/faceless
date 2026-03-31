import axios from "axios";
import { supabase } from "../../lib/supabase";
import { getImageGenerationUrls } from "../../lib/apis/image-gen-apis.js";

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
  logger.info(`Getting Access Points`);

  const image_generation_urls = await getImageGenerationUrls("cloudfare_worker");
  console.log(image_generation_urls);

  for (const urlData of image_generation_urls) {
    logger.info(`Trying URL id=${urlData.id}: ${urlData.value}`);

    try {
      // 1️⃣ Call Cloudflare Worker — flux-1-schnell via mode:image
      const response = await axios.post(
        urlData.value,
        {
          prompt,
          mode: "image",
          model: "@cf/black-forest-labs/flux-1-schnell",
        },
        {
          headers: {
            Authorization: `Bearer FACELESSSTUDIO`,
            "Content-Type": "application/json",
          },
          timeout: 90000,
        }
      );

      const base64Image = response.data?.image;
      if (!base64Image) throw new Error("No image returned in worker response");

      // 2️⃣ Decode base64 → Buffer for Supabase
      const buffer = Buffer.from(base64Image, "base64");

      // 3️⃣ Upload to Supabase (upsert: true overwrites if file already exists)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(destinationPath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) throw error;
      if (!data || !data.path) throw new Error("Supabase upload failed, no path returned");

      // 4️⃣ Return public URL
      if (makePublic) {
        const { data: publicData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (!publicData?.publicUrl) throw new Error("Failed to get public URL");

        logger.info(`Image uploaded successfully via id=${urlData.id}: ${publicData.publicUrl}`);
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
      logger.warn(`URL id=${urlData.id} (${urlData.value}) failed: ${err.message}. Trying next...`);
    }
  }

  // All URLs exhausted
  logger.error(`All image generation URLs failed for scene ${sceneNumber}`);
  return {
    success: false,
    scene: sceneNumber,
    error: "All image generation URLs exhausted with no success",
    url: null,
  };
}