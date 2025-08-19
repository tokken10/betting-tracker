# Betting Tracker

A simple web application for tracking wagers. The project combines a Node.js/Express backend and static HTML pages for user interaction.

## Features

- User registration and authentication
- Record, update, and review bets
- REST API built with Express and MongoDB via Mongoose

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the API server:
   ```bash
   npm start
   ```
   The server expects environment variables such as your MongoDB connection string.

## Repository Structure

- `api/` – entry point for the Express application
- `src/` – application logic, routes, and database configuration
- Static HTML files (`index.html`, `login.html`, etc.) serve as the frontend

## Contributing

Feel free to open issues or submit pull requests to improve the project.
