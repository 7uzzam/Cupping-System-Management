# External QR Service Audit

## Scope

This audit covers the current usage of the external QR endpoint:

- `https://api.qrserver.com/v1/create-qr-code/`

No production customer data was sent during this audit.

## Where it is used

In `index.html`:

- `function thermalQrImageUrl(data, displayPx)` builds:
  - `https://api.qrserver.com/v1/create-qr-code/?size=...&data=...&ecc=M&margin=8`
- Called for receipt-side communication QR images:
  - WhatsApp center QR (`https://wa.me/<number>`)
  - Center location/site QR

## Is it used for ZATCA tax QR?

No evidence that the ZATCA TLV payload itself is delegated to this service in current code path.  
This endpoint is used for rendered QR images in receipt sections where URL/text payload is passed directly to `data=`.

## Data sent to external QR service

Potential payload examples:

- `https://wa.me/<phone>`
- Site/location URL

Risk note:

- Payload is URL-encoded and sent as query string parameter (`data=...`) to third-party service.
- If future code passes invoice/customer fields into this function, that data would leave the device.

## Offline behavior

- Without internet access, external QR generation fails (network dependency).
- The app may still render receipt text, but these external QR images can fail to appear.

## Reliability risk

- Service outage / DNS / firewall can break QR image rendering.
- Third-party rate limiting or policy changes can impact output.

## Security & Privacy Classification

| Category | Risk | Notes |
|---|---|---|
| Privacy | Medium | URL payload sent to third-party endpoint |
| Security | Low-Medium | External dependency in print path |
| Offline availability | High | Fails without internet |
| Reliability | Medium | External SLA not controlled by app |

## Local replacement feasibility

Recommended future hardening (separate task):

1. Replace external QR API with local QR generation library (renderer or main process).
2. Keep payload generation fully on-device.
3. Preserve current QR size/margin/ecc visual behavior.
4. Add tests verifying:
   - identical payload
   - identical dimensions
   - deterministic output offline

This audit does **not** change QR behavior in the current font-fix task.
