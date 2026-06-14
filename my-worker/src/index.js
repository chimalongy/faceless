export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response(
        'Use a POST request with JSON body: { "prompt": "...", "mode": "text|image", "model": "...", "width": 1024, "height": 1024 }',
        { status: 405, headers: { "Content-Type": "text/plain" } }
      );
    }

    try {
      const {
        prompt,
        mode = "text",
        model,
        width,
        height,
        // For img2img / inpainting — base64-encoded input image & mask
        image: inputImageB64,
        mask: inputMaskB64,
      } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing 'prompt' field" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ─── TEXT TO TEXT ────────────────────────────────────────────────────────
      if (mode === "text") {
        const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt });
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // ─── TEXT TO IMAGE ───────────────────────────────────────────────────────
      if (mode === "image") {
        if (!model) {
          return new Response(JSON.stringify({ error: "Missing 'model' field for image mode" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Helper: convert a ReadableStream → Uint8Array → base64 string
        async function streamToBase64(stream) {
          const reader = stream.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          let totalLength = 0;
          for (const chunk of chunks) totalLength += chunk.length;
          const merged = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }
          let binary = "";
          for (let i = 0; i < merged.length; i++) {
            binary += String.fromCharCode(merged[i]);
          }
          return btoa(binary);
        }

        // Helper: build a multipart FormData, serialize via Response, return { body, contentType }
        async function buildMultipart(fields) {
          const form = new FormData();
          for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined && val !== null) form.append(key, String(val));
          }
          const formResponse = new Response(form);
          return {
            body: formResponse.body,
            contentType: formResponse.headers.get("content-type"),
          };
        }

        let base64Image = null;

        switch (model) {

          // ── FLUX.1 Schnell ──────────────────────────────────────────────────
          // Plain JSON. Returns: { image: "<base64 JPEG>" }. No width/height support.
          case "@cf/black-forest-labs/flux-1-schnell": {
            const result = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
              prompt,
              steps: 8,
            });
            base64Image = result.image;
            break;
          }

          // ── FLUX.2 Klein 4B ─────────────────────────────────────────────────
          // REQUIRES multipart/form-data. Returns: { image: "<base64>" }
          case "@cf/black-forest-labs/flux-2-klein-4b": {
            const { body, contentType } = await buildMultipart({
              prompt,
              ...(width  ? { width:  String(width)  } : {}),
              ...(height ? { height: String(height) } : {}),
            });
            const result = await env.AI.run("@cf/black-forest-labs/flux-2-klein-4b", {
              multipart: { body, contentType },
            });
            base64Image = result.image;
            break;
          }

          // ── FLUX.2 Klein 9B ─────────────────────────────────────────────────
          // REQUIRES multipart/form-data. Returns: { image: "<base64>" }
          case "@cf/black-forest-labs/flux-2-klein-9b": {
            const { body, contentType } = await buildMultipart({
              prompt,
              ...(width  ? { width:  String(width)  } : {}),
              ...(height ? { height: String(height) } : {}),
            });
            const result = await env.AI.run("@cf/black-forest-labs/flux-2-klein-9b", {
              multipart: { body, contentType },
            });
            base64Image = result.image;
            break;
          }

          // ── FLUX.2 Dev ──────────────────────────────────────────────────────
          // REQUIRES multipart/form-data. Returns: { image: "<base64>" }
          case "@cf/black-forest-labs/flux-2-dev": {
            const { body, contentType } = await buildMultipart({
              prompt,
              width:  String(width  || 1024),
              height: String(height || 768),
            });
            const result = await env.AI.run("@cf/black-forest-labs/flux-2-dev", {
              multipart: { body, contentType },
            });
            base64Image = result.image ?? await streamToBase64(result);
            break;
          }

          // ── SDXL Base 1.0 ───────────────────────────────────────────────────
          // Plain JSON. Returns: ReadableStream (PNG).
          case "@cf/stabilityai/stable-diffusion-xl-base-1.0": {
            const params = { prompt };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const stream = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", params);
            base64Image = await streamToBase64(stream);
            break;
          }

          // ── SDXL Lightning ──────────────────────────────────────────────────
          // Plain JSON. Returns: ReadableStream (PNG).
          case "@cf/bytedance/stable-diffusion-xl-lightning": {
            const params = { prompt };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const stream = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", params);
            base64Image = await streamToBase64(stream);
            break;
          }

          // ── SD v1.5 img2img ─────────────────────────────────────────────────
          // Requires `image` (uint8 array). `mask` optional.
          // Returns: ReadableStream (PNG).
          case "@cf/runwayml/stable-diffusion-v1-5-img2img": {
            if (!inputImageB64) {
              return new Response(
                JSON.stringify({ error: "This model requires an input image (base64). Please upload an image." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
            const imageBytes = Uint8Array.from(atob(inputImageB64), (c) => c.charCodeAt(0));
            const params = {
              prompt,
              image: [...imageBytes],
              strength: 0.75,
            };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const stream = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-img2img", params);
            base64Image = await streamToBase64(stream);
            break;
          }

          // ── SD v1.5 Inpainting ──────────────────────────────────────────────
          // Requires `image` (uint8 array) AND `mask` (uint8 array).
          // Returns: ReadableStream (PNG).
          case "@cf/runwayml/stable-diffusion-v1-5-inpainting": {
            if (!inputImageB64 || !inputMaskB64) {
              return new Response(
                JSON.stringify({ error: "This model requires both an input image and a mask image (base64). Please upload both." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
            const imageBytes = Uint8Array.from(atob(inputImageB64), (c) => c.charCodeAt(0));
            const maskBytes  = Uint8Array.from(atob(inputMaskB64),  (c) => c.charCodeAt(0));
            const params = {
              prompt,
              image:    [...imageBytes],
              mask:     [...maskBytes],
              strength: 0.75,
            };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const stream = await env.AI.run("@cf/runwayml/stable-diffusion-v1-5-inpainting", params);
            base64Image = await streamToBase64(stream);
            break;
          }

          // ── Leonardo Phoenix 1.0 ────────────────────────────────────────────
          // Correct namespace: @cf/leonardo/phoenix-1.0 (NOT @cf/leonardo-ai/...)
          // Plain JSON. Returns: { image: "<base64>" }
          case "@cf/leonardo/phoenix-1.0": {
            const params = { prompt };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const result = await env.AI.run("@cf/leonardo/phoenix-1.0", params);
            base64Image = result.image ?? await streamToBase64(result);
            break;
          }

          // ── Leonardo Lucid Origin ───────────────────────────────────────────
          // Correct namespace: @cf/leonardo/lucid-origin (NOT @cf/leonardo-ai/...)
          // Plain JSON. Returns: { image: "<base64>" }
          case "@cf/leonardo/lucid-origin": {
            const params = { prompt };
            if (width)  params.width  = Number(width);
            if (height) params.height = Number(height);
            const result = await env.AI.run("@cf/leonardo/lucid-origin", params);
            base64Image = result.image ?? await streamToBase64(result);
            break;
          }

          default:
            return new Response(JSON.stringify({ error: `Unknown image model: "${model}"` }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ image: base64Image }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `Unknown mode: "${mode}"` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};