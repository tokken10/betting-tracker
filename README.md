# Betting Tracker

## Environment Variables

The backend uses an `ALLOWED_ORIGINS` variable to control which origins may
make cross-origin requests.

```
ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

Provide a comma-separated list of origins; each origin will be trimmed and
checked against incoming request origins.
