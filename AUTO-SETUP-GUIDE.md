# Simplified Setup Guide: Jira Clone with Neon Database

This guide explains how to use our guided setup scripts to set up your Jira clone application with Neon PostgreSQL database.

## 1. Guided Neon Database Setup

We've created a script that guides you through setting up your Neon database:

```bash
npm run auto-setup-neon
```

This script will:
1. Open the Neon signup page in your browser
2. Guide you step-by-step to create a database
3. Help you get the connection string
4. Update your .env file automatically
5. Set up your database schema using Prisma
6. Generate the Prisma client

### Prerequisites

None! The script will help you create a Neon account if you don't have one.

### Step-by-Step

1. Run the setup script:
   ```bash
   npm run auto-setup-neon
   ```

2. Follow the prompts in the terminal and browser:
   - Create a Neon account when the browser opens
   - Create a new project
   - Copy the connection string
   - Paste it into the terminal when prompted

3. The script will automatically:
   - Update your .env file with the connection string
   - Create the database schema using Prisma
   - Generate the Prisma client

## 2. Vercel Deployment

### Option 1: Automated Vercel Setup

We've created a script to help set up your Vercel environment variables:

```bash
npm run setup-vercel
```

Prerequisites:
- Vercel CLI installed (`npm install -g vercel`)
- Logged in to Vercel CLI (`vercel login`)
- Vercel project already created

The script will guide you through setting up all required environment variables in your Vercel project.

### Option 2: Manual Vercel Setup

1. Create a Vercel project linked to your GitHub repository
2. Use the optimized `.env.vercel` file as a reference for environment variables
3. Set up Neon PostgreSQL through Vercel's Storage integration

## 3. Complete Application Setup

After setting up your database and deploying to Vercel, you need to:

1. Set up authentication with Clerk:
   - Create a Clerk account (https://clerk.dev)
   - Add your Vercel domain to allowed URLs
   - Update your environment variables with Clerk API keys

2. (Optional) Set up Stream for chat functionality:
   - Create a Stream account (https://getstream.io)
   - Add your Vercel domain to authorized domains
   - Update your environment variables with Stream API keys

## 4. Running the Application Locally

Once your database is set up, you can run the application locally:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your Neon database is active
2. Check your .env file for correct database credentials
3. Ensure your connection string includes `sslmode=require`
4. Run the test script:
   ```bash
   node scripts/test-neon-db.js
   ```

### Authentication Issues

If login doesn't work:

1. Check your Clerk API keys in the .env file
2. Ensure you've set up a Clerk application correctly
3. Verify `localhost:3000` is in your allowed URLs in Clerk dashboard