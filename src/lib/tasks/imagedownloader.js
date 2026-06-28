import axios from "axios";
import { supabase } from "../../lib/supabase";
import { getImageGenerationUrls } from "../../lib/apis/getapis.js";

export async function downloadandUploadImageToSupabase(
  sceneNumber,
  destinationPath,
  prompt,
  logger,
  storyId = null
) {
  const bucketName = process.env.SUPABASE_BUCKET;
  const makePublic = true;
  const contentType = "image/jpeg";

  logger.info(`Generating image for scene: ${sceneNumber}`);
  logger.info(`Prompt: ${prompt}`);
  logger.info(`Getting Access Points`);

  let imageGenModel = 'cloudfare_worker';
  if (storyId) {
    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .single();
      
      if (story && story.user_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('image_gen_model')
          .eq('id', story.user_id)
          .single();
        
        if (user && user.image_gen_model) {
          imageGenModel = user.image_gen_model;
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch user image_gen_model preference: ${err.message}. Defaulting to cloudfare_worker.`);
    }
  }

  logger.info(`Selected image generation model: ${imageGenModel}`);
  let image_generation_urls = await getImageGenerationUrls(imageGenModel);
  
  if (imageGenModel === 'modal_service' && (!image_generation_urls || image_generation_urls.length === 0)) {
    logger.warn('No API endpoints found for modal_service in image_apis. Falling back to cloudfare_worker.');
    imageGenModel = 'cloudfare_worker';
    image_generation_urls = await getImageGenerationUrls('cloudfare_worker');
  }

  for (const urlData of image_generation_urls) {
    if (imageGenModel === 'modal_service' && urlData.usage_count !== null && urlData.usage_count !== undefined && urlData.usage_count <= 0) {
      logger.warn(`Skipping Modal endpoint id=${urlData.id} because usage limit of 300 has been reached.`);
      continue;
    }

    logger.info(`Trying URL id=${urlData.id}: ${urlData.value}`);

    try {
      let response;
      if (imageGenModel === 'modal_service') {
        // 1️⃣ Call Modal Service API
        response = await axios.post(
          urlData.value,
          {
            prompt,
            width: 1920,
            height: 1088
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 120000,
          }
        );
      } else {
        // 1️⃣ Call Cloudflare Worker — flux-1-schnell via mode:image
        response = await axios.post(
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
      }

      let base64Image = response.data?.image;
      if (!base64Image) throw new Error("No image returned in response");

      if (imageGenModel === 'modal_service' && base64Image.includes(',')) {
        base64Image = base64Image.split(',')[1];
      }

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

      // 3.5️⃣ Decrement usage count if Modal Service was used successfully
      if (imageGenModel === 'modal_service' && urlData.usage_count !== null && urlData.usage_count !== undefined) {
        try {
          const newCount = Math.max(0, urlData.usage_count - 1);
          const { error: updateError } = await supabase
            .from('image_apis')
            .update({ usage_count: newCount })
            .eq('id', urlData.id);
          
          if (updateError) {
            logger.error(`Failed to update usage_count for Modal endpoint id=${urlData.id}:`, updateError);
          } else {
            logger.info(`Updated usage_count for Modal endpoint id=${urlData.id} to ${newCount}`);
          }
        } catch (dbErr) {
          logger.error(`Failed to update usage_count database write for id=${urlData.id}:`, dbErr);
        }
      }

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