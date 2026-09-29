// Cloudflare Pages Function: /api/send-email
// Sends transactional emails directly without launching desktop/mobile mail apps

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { to, subject, html, text, judgeName } = body;

    if (!to || !to.includes('@')) {
      return new Response(JSON.stringify({ status: 'error', message: 'Valid recipient email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 1. Check if Resend API key is configured
    const resendKey = env.RESEND_API_KEY;
    if (resendKey) {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'KNSDC Official <admin@knsdc.in>',
          to: [to],
          subject: subject || 'Judge Appointment & Direct Login Credentials',
          html: html,
          text: text
        })
      });

      if (resendResp.ok) {
        const resData = await resendResp.json();
        return new Response(JSON.stringify({ status: 'success', provider: 'resend', data: resData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. Fallback: MailChannels (native free Cloudflare Workers email dispatch)
    try {
      const mcResp = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to, name: judgeName || 'Judge' }]
            }
          ],
          from: {
            email: env.EMAIL_FROM_ADDR || 'noreply@knsdc.in',
            name: 'Kalikapur Nabin Sangha'
          },
          subject: subject || 'Official Judge Appointment & Login Credentials',
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html }
          ]
        })
      });

      if (mcResp.status === 200 || mcResp.status === 202) {
        return new Response(JSON.stringify({ status: 'success', provider: 'mailchannels' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    } catch (mcErr) {
      console.warn('Mailchannels fallback error:', mcErr.message);
    }

    // 3. If neither provider is actively sending, return status ready with guidance
    return new Response(JSON.stringify({
      status: 'pending_provider',
      message: 'Email dispatch ready. Add RESEND_API_KEY in Cloudflare Pages environment variables to enable 100% automated background email delivery.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
