# 📱 Android SMS Forwarder Setup Guide
## Auto-Detect UPI Payments → KNSDC Server

## How It Works

Bank SMS arrives → Android Forwarder App → HTTP POST /api/webhook/payment → Server parses → WebSocket push → Browser shows 🎉

## Method 1: SMS Forwarder App (Free)

Install: 'SMS Forwarder & Auto Reply' from Play Store

Rule settings:
- Trigger: Incoming SMS
- Filter Sender: HDFCBK, SBIINB, ICICIB, AXISBK, PAYTM, PhonePe, GPAY
- Filter keyword: credited
- Action: HTTP POST
- URL: https://your-domain.com/api/webhook/payment
- Header: Authorization: Bearer zero_gateway_secret_key_8849
- Body: {"message":"[message]","sender":"[sender]","title":"Bank SMS"}

## Method 2: Tasker (for PhonePe/GPay notifications)

Profile: Event > Notification > App = com.phonepe.app
Task: HTTP POST to webhook with notification text

## Method 3: Manual Test (curl)

curl -X POST https://your-domain.com/api/webhook/payment -H 'Authorization: Bearer zero_gateway_secret_key_8849' -H 'Content-Type: application/json' -d '{"message":"A/c XX9281 credited Rs.500 via UPI Ref 409821034521","sender":"HDFCBK"}'

## Webhook Reference

URL: POST /api/webhook/payment
Auth: Authorization: Bearer zero_gateway_secret_key_8849
Body: { message, sender, title }

Supported: HDFC, SBI, ICICI, Axis, Yes, Kotak, PNB, PhonePe, GPay, Paytm
