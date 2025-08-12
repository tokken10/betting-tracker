#!/bin/bash
set -e  # exit on error

git pull origin main
cd betting-tracker-backend
npm run dev
npm start