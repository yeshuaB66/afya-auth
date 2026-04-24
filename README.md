# afya-auth
A simple Node.js platform that integrates with the Afyanalytics Health Platform using a two-step handshake authentication flow.

## Setup

1. Clone the repo
2. Install dependencies:
```bash
   npm install
```
3. Copy `.env.example` to `.env` and fill in your credentials:
PLATFORM_NAME=
PLATFORM_KEY=
PLATFORM_SECRET=
API_BASE_URL=
CALLBACK_URL=
PORT=3000
4. Run:
```bash
   node index.js
```
5. Open `http://localhost:3000`

## How the Handshake Flow Works

1. **Initiate Handshake** — sends platform credentials to `/initiate-handshake`, receives a token valid for 15 minutes
2. **Complete Handshake** — sends the token to `/complete-handshake`, receives an `access_token`
3. **Full Flow** — runs both steps in one click

## How Expiry is Handled

- If the handshake token expires before completing, it is cleared and an error is returned
- A new handshake must be initiated to try again
- The UI shows token status and expiry times in real time
