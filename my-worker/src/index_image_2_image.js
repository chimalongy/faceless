export default {
  async fetch(request, env) {
    const API_KEY = env.API_KEY;
    const url = new URL(request.url);
    const auth = request.headers.get("Authorization");

    // 🔐 API Key check
    if (auth !== `Bearer ${API_KEY}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    // 🚫 Only POST / allowed
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    try {
      const { prompt, image, strength = 0.7 } = await request.json();

      if (!prompt || !image) {
        return json({ error: "prompt and image are required" }, 400);
      }

      // 🧠 Call img2img model
      const result = await env.AI.run(
        "@cf/runwayml/stable-diffusion-v1-5-img2img",
        {
          prompt,
          image,     // base64 input image
          strength,  // 0.0 → preserve input | 1.0 → heavy transformation
        }
      );

      return new Response(result, {
        headers: { "Content-Type": "image/jpeg" },
      });

    } catch (err) {
      return json({ error: "Failed to generate image", details: err.message }, 500);
    }
  },
};

// JSON response helper
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
