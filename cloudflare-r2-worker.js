// ==============================================================================
// CLOUDFLARE WORKER — DIRECT R2 UPLOAD & MANAGEMENT FOR KNSDC
// ==============================================================================
// Features:
// - Zero Egress Fees ($0 bandwidth cost)
// - Direct Upload to Cloudflare R2
// - Deterministic Key Overwrite (same place replacement for judges/participants)
// - Instant File Deletion (DELETE method or action=delete)
// - Fast Global CDN
// ==============================================================================

export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const corsHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };

    const urlObj = new URL(request.url);

    // Helper to extract bucket key from full URL or relative key
    const extractKey = (input) => {
      if (!input || typeof input !== "string") return "";
      let cleaned = input.trim();
      if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
        try {
          cleaned = new URL(cleaned).pathname;
        } catch (e) {
          // ignore
        }
      }
      return cleaned.replace(/^\/+/, "");
    };

    // 2. Handle DELETE Requests (e.g. DELETE /?key=judges/judge_1.jpg)
    if (request.method === "DELETE") {
      try {
        let keyToDelete = extractKey(urlObj.searchParams.get("key") || urlObj.searchParams.get("fileUrl"));
        if (!keyToDelete && request.headers.get("content-type")?.includes("application/json")) {
          const body = await request.json().catch(() => ({}));
          keyToDelete = extractKey(body.key || body.fileUrl);
        }

        if (!keyToDelete) {
          return new Response(JSON.stringify({ status: "error", message: "Missing 'key' parameter to delete." }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        await env.MY_BUCKET.delete(keyToDelete);
        return new Response(JSON.stringify({ status: "success", message: "File deleted successfully", deletedKey: keyToDelete }), {
          headers: corsHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ status: "error", message: err.message || "Failed to delete file from R2" }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // 3. Handle GET / Ping
    if (request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", message: "KNSDC Cloudflare R2 Storage Worker is live!" }), {
        headers: corsHeaders,
      });
    }

    // 4. Handle POST Requests (Upload or Action=Delete)
    if (request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";

        // Check if JSON POST with action === 'delete'
        if (contentType.includes("application/json")) {
          const body = await request.json().catch(() => ({}));
          if (body.action === "delete" || body.deleteKey) {
            const keyToDelete = extractKey(body.key || body.deleteKey || body.fileUrl);
            if (!keyToDelete) {
              return new Response(JSON.stringify({ status: "error", message: "Missing key to delete." }), {
                status: 400,
                headers: corsHeaders,
              });
            }
            await env.MY_BUCKET.delete(keyToDelete);
            return new Response(JSON.stringify({ status: "success", message: "File deleted successfully", deletedKey: keyToDelete }), {
              headers: corsHeaders,
            });
          }
        }

        const formData = await request.formData();

        // Check if FormData has action=delete
        if (formData.get("action") === "delete" || formData.get("deleteKey")) {
          const keyToDelete = extractKey(formData.get("key") || formData.get("deleteKey") || formData.get("fileUrl"));
          if (keyToDelete) {
            await env.MY_BUCKET.delete(keyToDelete);
            return new Response(JSON.stringify({ status: "success", message: "File deleted successfully", deletedKey: keyToDelete }), {
              headers: corsHeaders,
            });
          }
        }

        const file = formData.get("file");
        const pathPrefix = (formData.get("pathPrefix") || "participants").replace(/^\/+|\/+$/g, "");
        const customKey = formData.get("customKey") || formData.get("fileName");

        if (!file || typeof file === "string") {
          return new Response(JSON.stringify({ status: "error", message: "No file provided." }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Determine destination key: customKey overwrites in the same place!
        let key = "";
        if (customKey && typeof customKey === "string" && customKey.trim()) {
          key = extractKey(customKey.trim());
        } else {
          const ext = file.name ? file.name.split(".").pop() : "bin";
          key = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        }

        // Upload directly into Cloudflare R2 (overwrites existing key if present)
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
            headers: corsHeaders,
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ status: "error", message: err.message || "Failed to process R2 request" }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }

    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  },
};
