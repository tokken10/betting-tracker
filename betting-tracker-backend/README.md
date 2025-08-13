# Betting Tracker Backend

## CORS configuration

This server uses a flexible CORS setup that supports:

- Exact origins defined in environment variables `FRONTEND_URL` and optional `FRONTEND_URL_ALT`.
- Local development at `http://localhost:3000` and `http://localhost:5173`.
- Preview deployments of the `betting-tracker-nine` frontend project on Vercel.

### Environment variables

In your Vercel project settings add:

```
FRONTEND_URL=https://betting-tracker-nine.vercel.app
FRONTEND_URL_ALT=https://your-custom-domain.com  # optional
ALLOWED_ORIGINS=https://example1.com,https://example2.com  # optional, comma-separated
```

`ALLOWED_ORIGINS` is parsed as a comma-separated list and merged with the
exact origins above.

### Frontend API calls

Always call the backend using the alias domain:

```
API_BASE_URL=https://betting-tracker-backend.vercel.app
```

Avoid using random deployment URLs that Vercel generates for each preview.

