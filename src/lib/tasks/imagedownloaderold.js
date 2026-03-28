import axios from "axios";
import fs from "fs";

export async function generateImage(prompt, outputPath) {
  try {
    const response = await axios.post(
      "https://my-worker.me-chimaobi.workers.dev/",
      { prompt },
      {
        headers: {
          Authorization: `Bearer FACELESSSTUDIO`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // important for images
        timeout: 90000,
      }
    );

    fs.writeFileSync(outputPath, response.data);
    return {success: true, image: outputPath};

  } catch (error) {
    console.error(
      "Image generation failed:",
      error.response?.data?.toString() || error.message
    );
    return {success: false, error: error.message};
  }
}
