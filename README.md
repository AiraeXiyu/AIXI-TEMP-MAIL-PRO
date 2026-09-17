# AIXI TEMP MAIL

Mobile-first disposable email web app for Vercel.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Upload this project to GitHub.
2. Import the repository into Vercel.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Optional environment variable:

```env
NEXT_PUBLIC_API_BASE=https://aixi-temp-mail.airaexiyu.workers.dev
```

The app already contains this API URL as the default fallback.

## Notes

- The frontend uses the API endpoints `/api/gen`, `/api/use`, `/api/inbox`, and `/api/read`.
- The API must allow browser CORS requests.
- The custom domain displayed in the custom-email field is set to `akunlama.com` based on the supplied API implementation. Update `DEFAULT_DOMAIN` in `app/page.js` if your current API uses another email domain.
- The character image is stored at `public/character.jpg`.
