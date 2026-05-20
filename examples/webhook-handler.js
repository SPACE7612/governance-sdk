/**
 * Handle incoming BuildPaid governance webhooks.
 *
 * Every webhook payload is signed with HMAC-SHA256.
 * Always verify the signature before processing.
 */

const http = require('http');
const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
  sdkSecret: process.env.BUILDPAID_SDK_SECRET,
});

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhooks/buildpaid') {
    res.writeHead(404);
    return res.end();
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    // Verify signature before processing
    const signature = req.headers['x-buildpaid-signature'];
    if (!signature || !client.verifyWebhook(body, signature)) {
      console.error('✗ Invalid webhook signature — rejecting');
      res.writeHead(401);
      return res.end('Invalid signature');
    }

    const event = JSON.parse(body);
    console.log('✓ Verified webhook:', event.event);

    // Route by event type
    switch (event.event) {
      case 'VERDICT.ISSUED':
        console.log(`  Project ${event.entity_id}: ${event.data.verdict} (score: ${event.data.score})`);
        break;

      case 'DRAW.SUBMITTED':
        console.log(`  Draw submitted for ${event.entity_id}: $${event.data.amount}`);
        break;

      case 'PAYMENT.GATED':
        console.log(`  Payment BLOCKED for ${event.entity_id}: ${event.data.reason}`);
        break;

      case 'COMPLIANCE.VIOLATION':
        console.log(`  Violation on ${event.entity_id}: ${event.data.rail} — ${event.data.description}`);
        break;

      default:
        console.log(`  Event: ${event.event}`, event.data);
    }

    res.writeHead(200);
    res.end('OK');
  });
});

server.listen(3000, () => {
  console.log('Webhook handler listening on :3000/webhooks/buildpaid');
});
