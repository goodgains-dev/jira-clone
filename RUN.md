# Quick Start Guide: Running the Jira Clone

This guide provides step-by-step instructions to get the Jira clone application running locally and set up your database.

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Git installed
- A Neon account for PostgreSQL (https://neon.tech)
- A Clerk account for authentication (https://clerk.dev)
- Optional: A Stream account for chat (https://getstream.io)

## Step 1: Set Up Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your API keys and database credentials:
   - Neon PostgreSQL connection strings
   - Clerk API keys
   - Stream API keys (optional)

## Step 2: Set Up the Database

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the database setup script:
   ```bash
   npm run setup-db
   ```

   This script will:
   - Connect to your Neon database
   - Create the schema
   - Apply migrations
   - Generate the Prisma client

## Step 3: Run the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify your Neon database is active
2. Check your `.env` file for correct database credentials
3. Ensure your connection string includes `sslmode=require`
4. Run the test script:
   ```bash
   node scripts/test-neon-db.js
   ```

### Authentication Issues

If login doesn't work:

1. Check your Clerk API keys in the `.env` file
2. Ensure you've set up a Clerk application correctly
3. Verify `localhost:3000` is in your allowed URLs in Clerk dashboard

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Set up database
npm run setup-db

# Generate Prisma client
npx prisma generate

# Create database migration
npx prisma migrate dev --name your_migration_name

# Reset database (caution: deletes all data)
npx prisma migrate reset

# Test database connection
node scripts/test-neon-db.js

# Lint code
npm run lint
```

## Next Steps

Once your application is running:

1. Create an organization
2. Create a project
3. Create a sprint
4. Add issues
5. Try out the chat and comment features
6. Check the analytics dashboard

Ready to deploy? See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to the web.