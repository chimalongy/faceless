import axios from "axios";
import { supabase } from "../../lib/supabase";

export async function downloadAndUploadToSupabase(
  fileUrl,
  destinationPath,

) {
  const bucketName = process.env.SUPABASE_BUCKET;
  let makePublic= true;
  

  try {
    // 1. Download file using axios
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    const buffer = Buffer.from(response.data);

    // 2. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(destinationPath, buffer, {
        contentType: "audio/wav",
        upsert: true
      });

    if (error) throw error;

    // 3. Get public or signed URL
    if (makePublic) {
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        path: data.path,
        url: publicData.publicUrl
      };
    } else {
      const { data: signedData, error: signedErr } =
        await supabase.storage
          .from(bucketName)
          .createSignedUrl(data.path, 60 * 60); // 1 hour

      if (signedErr) throw signedErr;

      return {
        success: true,
        path: data.path,
        url: signedData.signedUrl
      };
    }
  } catch (err) {
    console.error("Upload failed:", err);
    return { success: false, error: err.message };
  }
}
