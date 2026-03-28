export default {
  async fetch(request, env) {
    const API_KEY = env.API_KEY;
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization");

    // 🔐 Simple API key check
    if (auth !== `Bearer ${API_KEY}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 🚫 Only allow POST requests to /
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    try {
      const { prompt } = await request.json();
      if (!prompt) return json({ error: "Prompt is required" }, 400);

      // 🧠 Call Flux 1 Schnell model
      const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });

      // ⚠️ Parse result if it's JSON with image key
      let base64Image;
      if (typeof result === "string") {
        try {
          const parsed = JSON.parse(result);
          base64Image = parsed.image || parsed.data; // some workers return under "image" or "data"
        } catch {
          base64Image = result; // fallback: maybe it's raw base64
        }
      } else if (result.image) {
        base64Image = result.image;
      } else {
        throw new Error("No image data returned from model");
      }

      if (!base64Image) throw new Error("No base64 image found in response");

      // Convert base64 to bytes
      const imageBytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

      return new Response(imageBytes, {
        headers: { "Content-Type": "image/jpeg" },
      });
    } catch (err) {
      return json({ error: "Failed to generate image", details: err.message }, 500);
    }
  },
};

// 📦 Helper for JSON responses
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
