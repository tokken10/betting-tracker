# Betting Tracker

## Environment Setup

Create a `.env` file in the project root to configure environment variables used by the application and scripts.

```env
# MongoDB connection string
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Secret used for signing JSON Web Tokens
JWT_SECRET=replace_this_with_a_secure_value

# Comma separated list of origins allowed to access the API
ALLOWED_ORIGINS=http://localhost:3000

# Optional: default user ID for scripts/assignUserToBets.js
# USER_ID=<mongo_user_id>
```

The scripts in the `scripts/` directory load these values via [`dotenv`](https://www.npmjs.com/package/dotenv). Ensure the `.env` file exists before running commands such as:

```bash
npm run seed:nowbenj
npm run migrate:bet-users
```
