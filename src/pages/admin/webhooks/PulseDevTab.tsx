import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

interface DevTabProps {
  isFr: boolean;
}

const PAYLOAD_EXAMPLE = `{
  "event": "purchase.completed",
  "timestamp": "2026-03-22T10:00:00Z",
  "organization_id": "uuid",
  "data": {
    "transaction_id": "txn_abc123",
    "amount": 5000,
    "currency": "XOF",
    "buyer_email": "john@example.com"
  }
}`;

const VERIFY_NODE = `const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-siteviral-signature'];
  const body = JSON.stringify(req.body);
  if (!verifySignature(body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  // Process event...
  res.status(200).send('OK');
});`;

const VERIFY_PYTHON = `import hmac, hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

# Flask example
@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('X-SiteViral-Signature')
    if not verify_signature(request.data, sig, os.environ['WEBHOOK_SECRET']):
        abort(401)
    event = request.json
    # Process event...
    return 'OK', 200`;

export function PulseDevTab({ isFr }: DevTabProps) {
  const [copied, setCopied] = useState('');
  const [lang, setLang] = useState<'node' | 'python'>('node');

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const CopyBtn = ({ id, text }: { id: string; text: string }) => (
    <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6" onClick={() => copy(text, id)}>
      {copied === id ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );

  return (
    <div className="space-y-5">
      {/* Payload format */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{isFr ? 'Format du payload' : 'Payload format'}</h3>
        <p className="text-[11px] text-muted-foreground mb-2">
          {isFr
            ? 'Chaque webhook envoie un POST JSON avec la structure suivante :'
            : 'Each webhook sends a JSON POST with the following structure:'}
        </p>
        <div className="relative rounded-lg border border-border bg-muted/30 p-3">
          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">{PAYLOAD_EXAMPLE}</pre>
          <CopyBtn id="payload" text={PAYLOAD_EXAMPLE} />
        </div>
      </div>

      {/* Headers */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{isFr ? 'Headers envoyés' : 'Sent headers'}</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="text-left p-2.5 font-medium text-muted-foreground">Header</th>
                <th className="text-left p-2.5 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-2.5 font-mono text-[11px]">Content-Type</td>
                <td className="p-2.5 text-muted-foreground">application/json</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2.5 font-mono text-[11px]">X-SiteViral-Signature</td>
                <td className="p-2.5 text-muted-foreground">{isFr ? 'Signature HMAC-SHA256 du body' : 'HMAC-SHA256 signature of the body'}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[11px]">X-SiteViral-Event</td>
                <td className="p-2.5 text-muted-foreground">{isFr ? 'Type d\'événement (ex: purchase.completed)' : 'Event type (e.g. purchase.completed)'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification guide */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{isFr ? 'Vérification de signature' : 'Signature verification'}</h3>
        <div className="flex gap-1 mb-2">
          <Button size="sm" variant={lang === 'node' ? 'default' : 'outline'} className="h-7 text-[10px] px-3" onClick={() => setLang('node')}>Node.js</Button>
          <Button size="sm" variant={lang === 'python' ? 'default' : 'outline'} className="h-7 text-[10px] px-3" onClick={() => setLang('python')}>Python</Button>
        </div>
        <div className="relative rounded-lg border border-border bg-muted/30 p-3">
          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-64">{lang === 'node' ? VERIFY_NODE : VERIFY_PYTHON}</pre>
          <CopyBtn id="code" text={lang === 'node' ? VERIFY_NODE : VERIFY_PYTHON} />
        </div>
      </div>

      {/* Retry policy */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{isFr ? 'Politique de rejeu' : 'Retry policy'}</h3>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1.5">
          <p>{isFr ? '• 5 tentatives maximum avec backoff exponentiel' : '• Up to 5 attempts with exponential backoff'}</p>
          <p>{isFr ? '• Délais : 1min → 4min → 16min → 1h → 4h' : '• Delays: 1min → 4min → 16min → 1h → 4h'}</p>
          <p>{isFr ? '• L\'endpoint est auto-pausé après 10 échecs consécutifs' : '• Endpoint is auto-paused after 10 consecutive failures'}</p>
          <p>{isFr ? '• Réponse attendue : HTTP 2xx dans les 10 secondes' : '• Expected response: HTTP 2xx within 10 seconds'}</p>
        </div>
      </div>
    </div>
  );
}
