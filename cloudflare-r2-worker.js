// ==============================================================================
// CLOUDFLARE WORKER — DIRECT R2 UPLOAD FOR PARTICIPANT MUSIC & IMAGES
// ==============================================================================
// Deploy this to Cloudflare Workers to allow 100% serverless uploads with:
// - Zero Egress Fees ($0 bandwidth cost)
// - Fast Global CDN
// - No local Node.js server required
//
// How to deploy in 2 minutes:
// 1. Go to Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker
// 2. Paste this code into the Worker editor.
// 3. Under Worker Settings -> Variables -> R2 Bucket Bindings:
//      Variable name: MY_BUCKET
//      R2 Bucket: my-app-uploads
// 4. Under Worker Settings -> Variables -> Environment Variables:
//      Variable name: PUBLIC_URL
//      Value: https://pub-407c9d11c2a04dc1973e0dc94d659214.r2.dev
// 5. Copy your Worker URL (e.g. https://knsdc-upload.yourname.workers.dev)
// 6. In index.html or lib/localSync-v4.js: window.CLOUDFLARE_UPLOAD_URL = 'https://knsdc-upload.yourname.workers.dev';
// ==============================================================================

export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ status: "ok", message: "KNSDC Cloudflare R2 Upload Worker is live!" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const pathPrefix = (formData.get("pathPrefix") || "participants").replace(/^\/+|\/+$/g, "");

      if (!file || typeof file === "string") {
        return new Response(JSON.stringify({ status: "error", message: "No file provided." }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const ext = file.name ? file.name.split(".").pop() : "bin";
      const key = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Upload directly into Cloudflare R2
      await env.MY_BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
        },
      });

      const publicBase = (env.PUBLIC_URL || "https://pub-407c9d11c2a04dc1973e0dc94d659214.r2.dev").replace(/\/+$/, "");
      const fileUrl = `${publicBase}/${key}`;

      return new Response(
        JSON.stringify({
          status: "success",
          fileUrl: fileUrl,
          imageUrl: fileUrl,
          key: key,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: "error", message: err.message || "Failed to upload to R2" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
