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
```

You can also manage origins entirely through the `ALLOWED_ORIGINS` variable. Provide comma‑separated values and prefix any regular expression with `re:`:

```
ALLOWED_ORIGINS=https://betting-tracker-nine.vercel.app,http://localhost:3000,re:^https?:\/\/betting-tracker-nine(-[a-z0-9-]+)?\.vercel\.app$
```

### Frontend API calls

Always call the backend using the alias domain:

```
API_BASE_URL=https://betting-tracker-backend.vercel.app
```

Avoid using random deployment URLs that Vercel generates for each preview.

