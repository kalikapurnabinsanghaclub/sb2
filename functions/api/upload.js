// Cloudflare Pages Function: /api/upload
// Handles uploading files and audio tracks directly into Cloudflare R2

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image');
    const pathPrefix = (formData.get('pathPrefix') || 'media').toString();

    if (!file) {
      return new Response(JSON.stringify({ status: 'error', message: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const ext = file.name ? file.name.split('.').pop() : 'png';
    const cleanPrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
    const fileName = `${cleanPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Cloudflare R2 bucket binding
    const bucket = env.R2_BUCKET || env.BUCKET || env.knsdc_media;
    if (bucket) {
      await bucket.put(fileName, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' }
      });

      const publicBaseUrl = env.R2_PUBLIC_URL || 'https://pub-8312d730dfad4f298d7efc93ad64bb22.r2.dev';
      const fileUrl = `${publicBaseUrl.replace(/\/+$/, '')}/${fileName}`;

      return new Response(JSON.stringify({
        status: 'success',
        fileUrl,
        imageUrl: fileUrl,
        key: fileName
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({
      status: 'error',
      message: 'R2 bucket binding not configured in Cloudflare Pages settings'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
