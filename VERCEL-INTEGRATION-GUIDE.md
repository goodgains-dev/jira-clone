# Setting Up Jira Clone with Vercel's Neon PostgreSQL Integration

This guide provides a step-by-step process for deploying the Jira clone application using Vercel's built-in Neon PostgreSQL integration.

## Prerequisites

- GitHub account with your project code pushed to a repository
- Vercel account (you can sign up with your GitHub account at https://vercel.com/signup)
- Clerk account for authentication (https://clerk.dev)
- Stream account for chat functionality (optional)

## Step 1: Create a New Vercel Project

1. Log in to Vercel at https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository containing the Jira clone code
4. Configure your project settings:
   - Framework Preset: Next.js
   - Root Directory: ./ (or your project root)
   - Build Command: (leave as default)
   - Install Command: npm install
   - Output Directory: (leave as default)

## Step 2: Set Up Neon PostgreSQL Using Vercel Storage

1. In your project's dashboard, go to the "Storage" tab
2. Click "Connect Storage"
3. Select "Neon PostgreSQL"
4. Click "Create New" to create a new Neon PostgreSQL instance
5. Name your database (e.g., "jira-clone-db")
6. Choose the region closest to your users
7. Select the appropriate plan (the free plan is sufficient for getting started)
8. Click "Create" to provision your Neon PostgreSQL database

## Step 3: Environment Variable Configuration

There are two easy ways to configure your environment variables:

### Option 1: Use the Automated Setup Script (Recommended)

We've created a script that helps you easily set up all required environment variables in your Vercel project:

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Log in to the Vercel CLI:
   ```bash
   vercel login
   ```

3. Run the setup script:
   ```bash
   npm run setup-vercel
   ```

4. Follow the prompts to select your Vercel project and enter your API keys

### Option 2: Manual Configuration

Vercel will automatically add the `DATABASE_URL` environment variable with your new Neon database connection string. You need to manually add:

1. In your project settings, go to the "Environment Variables" tab
2. Add the following environment variables:
   ```
   # Add this manually for Neon compatibility
   DIRECT_URL=${DATABASE_URL}
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   CLERK_SECRET_KEY=your-clerk-secret-key
   
   # Stream Chat API (optional)
   NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
   STREAM_API_SECRET=your-stream-secret-key
   
   # Next.js
   NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
   
   # Prisma Configuration
   PRISMA_CLIENT_ENGINE_TYPE=dataproxy
   ```

Note: Replace the placeholder values with your actual API keys from Clerk and Stream.

For reference, you can check the `.env.vercel` file which contains all the optimized environment variables for Vercel deployment.

## Step 4: Database Schema Setup

1. Add these build commands to your "Settings" → "Build & Development Settings":
   - Add this to your build command: `&& npx prisma migrate deploy`
   - This will ensure your database schema is created during deployment

Alternatively, you can manually initialize your database schema:

1. In the Vercel dashboard, go to the "Storage" tab
2. Click on your Neon PostgreSQL instance
3. Click "Open Dashboard" to access the Neon dashboard
4. In Neon, navigate to the "SQL Editor"
5. Copy and paste the contents of the `database-schema.sql` file
6. Click "Run" to execute the SQL and create your tables

## Step 5: Deploy Your Application

1. In your project dashboard, click "Deploy"
2. Wait for the build and deployment process to complete
3. Once deployed, Vercel will provide you with a URL to access your application

## Step 6: Post-Deployment Configuration

### Configure Clerk Authentication

1. Log in to your Clerk dashboard
2. Go to your application settings
3. Add your Vercel deployment URL to:
   - JWT Templates
   - Allowed URLs
   - Redirect URLs

### Configure Stream Chat (if using)

1. Log in to your Stream dashboard
2. Go to your Chat application
3. Under "App Settings", add your Vercel deployment URL to the list of authorized domains

## Troubleshooting Database Issues

If your database tables are not created automatically:

1. Check if the Prisma migration command was executed during deployment
2. If not, you can manually run the SQL from `database-schema.sql` in the Neon SQL Editor
3. Verify your database connection by checking the application logs in Vercel

### Using the Neon SQL Editor

1. From your Vercel project, go to "Storage" → click on your Neon instance → "Open Dashboard"
2. In the Neon dashboard, navigate to the "SQL Editor"
3. Paste the contents of `database-schema.sql` and execute the queries

## Monitoring and Management

1. You can monitor your Neon database performance from the Vercel Storage tab
2. For more detailed database management, use the Neon dashboard accessible from Vercel
3. To check your application logs, use the "Logs" tab in your Vercel project dashboard

## Additional Resources

- [Vercel Docs: Storage](https://vercel.com/docs/storage)
- [Neon Docs: PostgreSQL](https://neon.tech/docs)
- [Prisma Docs: Deployment](https://www.prisma.io/docs/guides/deployment)