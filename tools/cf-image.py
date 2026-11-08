#!/usr/bin/env python3
"""Text-to-image via Cloudflare Workers AI (free tier: 10,000 Neurons/day).

Usage:
  CF_ACCOUNT_ID=... CF_API_TOKEN=... python3 tools/cf-image.py "prompt" out.png [--model flux|sdxl] [--steps 4] [--seed N]

Needs outbound HTTPS to api.cloudflare.com. Stdlib only. Never print or commit the token.
"""
import argparse, base64, json, os, sys, urllib.error, urllib.request

MODELS = {
    'flux': '@cf/black-forest-labs/flux-1-schnell',   # Apache 2.0, steps 1-8
    'sdxl': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('prompt')
    ap.add_argument('out')
    ap.add_argument('--model', default='flux', help='flux | sdxl | full @cf/... id')
    ap.add_argument('--steps', type=int, default=4)
    ap.add_argument('--seed', type=int)
    a = ap.parse_args()

    acct, tok = os.environ.get('CF_ACCOUNT_ID'), os.environ.get('CF_API_TOKEN')
    if not acct or not tok:
        sys.exit('ERROR: set CF_ACCOUNT_ID and CF_API_TOKEN')
    model = MODELS.get(a.model, a.model)
    body = {'prompt': a.prompt}
    if model.endswith('flux-1-schnell'):
        body['steps'] = max(1, min(8, a.steps))
    if a.seed is not None:
        body['seed'] = a.seed
    req = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run/{model}',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            ctype = r.headers.get('Content-Type', '')
            data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f'ERROR: HTTP {e.code}: {e.read()[:300].decode(errors="replace")}')
    except urllib.error.URLError as e:
        sys.exit(f'ERROR: cannot reach api.cloudflare.com ({e.reason}). Network allowlist?')
    if ctype.startswith('image/'):          # SDXL returns raw PNG
        img = data
    else:                                   # FLUX returns JSON with base64
        j = json.loads(data)
        if not j.get('success', True):
            sys.exit(f'ERROR: {j.get("errors")}')
        img = base64.b64decode(j['result']['image'])
    with open(a.out, 'wb') as f:
        f.write(img)
    print(f'OK {a.out} ({len(img)} bytes, model {model})')

if __name__ == '__main__':
    main()
