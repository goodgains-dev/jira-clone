# Quick Start Guide: Running the Jira Clone

This guide provides simplified step-by-step instructions to get the Jira clone application running locally with minimal effort.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Git installed

## One-Command Setup

We've created a single command that will:
1. Install all dependencies
2. Guide you through setting up a Neon database
3. Configure your database
4. Start the development server

```bash
npm run quick-start
```

## Manual Setup Process

If you prefer to go through the process step by step:

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Neon Database

Run our interactive database setup script:

```bash
npm run create-db
```

This script will:
- Open the Neon signup page in your browser
- Guide you through creating an account and database
- Help you copy and paste the connection details
- Automatically update your .env file

### Step 3: Initialize Database Schema

Once your Neon database is configured, run:

```bash
npm run setup-db
```

This will:
- Connect to your Neon database
- Create the schema
- Apply migrations
- Generate the Prisma client

### Step 4: Configure Authentication (Required)

The app uses Clerk for authentication. If you want to use authentication:

1. Create a free account at https://clerk.dev
2. Create a new application
3. Add `http://localhost:3000` to your allowed origins
4. Get your API keys from the Clerk dashboard
5. Update these keys in your `.env` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

### Step 5: Configure Chat (Optional)

For the chat functionality:

1. Create a free account at https://getstream.io
2. Create a new app
3. Get your API keys
4. Update these keys in your `.env` file:

```
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_secret_key
```

### Step 6: Start the Development Server

```bash
npm run dev
```

Access the app at http://localhost:3000

## Testing Your Database Connection

To verify your database connection is working:

```bash
node scripts/test-neon-db.js
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify your Neon database is active
2. Check your `.env` file for correct database credentials
3. Ensure your connection string includes `sslmode=require`

### Authentication Issues

If login doesn't work:

1. Check your Clerk API keys in the `.env` file
2. Ensure you've set up a Clerk application correctly
3. Verify `localhost:3000` is in your allowed URLs in Clerk dashboard

## Next Steps

Once your application is running:

1. Create an organization
2. Create a project
3. Create a sprint
4. Add issues
5. Try out the chat and comment features
6. Check the analytics dashboard

Ready to deploy? See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to the web.