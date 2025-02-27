# Deploying Jira Clone with Vercel and Neon PostgreSQL

This guide provides step-by-step instructions for deploying the Jira clone application using Vercel for hosting and Neon for the PostgreSQL database.

## Setting Up Neon PostgreSQL Database

1. **Create a Neon Account**:
   - Go to https://neon.tech and sign up for an account
   - After signing up, create a new project (choose a name like "jira-clone")

2. **Get Your Database Connection Details**:
   - In your Neon dashboard, click on your project
   - Go to "Connection Details" tab
   - Select "Prisma" from the dropdown menu
   - Copy the full connection string that looks like:
     ```
     postgresql://postgres:your-password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

3. **Database Schema/Tables**:
   Based on the Prisma schema, your database will have these tables:

   - **User**: Stores user information linked to Clerk auth
     - Fields: id, clerkUserId, email, name, imageUrl, createdAt, updatedAt
     - Relationships: createdIssues, assignedIssues, comments, messages

   - **Project**: Stores project details with links to organizations
     - Fields: id, name, key, description, organizationId, createdAt, updatedAt
     - Relationships: sprints, issues

   - **Sprint**: Stores sprint information within projects
     - Fields: id, name, startDate, endDate, status, projectId, createdAt, updatedAt
     - Relationships: project, issues

   - **Issue**: Core table for tracking tickets/issues
     - Fields: id, title, description, status, order, priority, assigneeId, reporterId, projectId, sprintId, createdAt, updatedAt
     - Relationships: assignee, reporter, project, sprint, comments, conversation, analytics

   - **Comment**: Stores comments on issues
     - Fields: id, content, issueId, authorId, createdAt, updatedAt
     - Relationships: issue, author

   - **ChatConversation**: Tracks chat threads per issue
     - Fields: id, issueId, streamChannelId, createdAt, updatedAt
     - Relationships: issue, messages

   - **ChatMessage**: Stores individual chat messages
     - Fields: id, content, conversationId, senderId, read, createdAt, updatedAt
     - Relationships: conversation, sender

   - **IssueAnalytic**: Tracks analytics data for issues
     - Fields: id, issueId, timeInTodo, timeInProgress, timeInReview, completionTime, statusChanges, lastStatusChange, createdAt, updatedAt
     - Relationships: issue

   The schema also includes these enums (custom types):
   - **SprintStatus**: PLANNED, ACTIVE, COMPLETED
   - **IssueStatus**: TODO, IN_PROGRESS, IN_REVIEW, DONE
   - **IssuePriority**: LOW, MEDIUM, HIGH, URGENT

## Deploying with Vercel

1. **Push Your Code to GitHub**:
   - Make sure your project is in a GitHub repository

2. **Set Up Vercel Project**:
   - Go to https://vercel.com
   - Connect your GitHub account
   - Create a new project from your repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./ (or your project root)

3. **Configure Environment Variables in Vercel**:
   Add these environment variables:

   ```
   # Database - Neon PostgreSQL
   DATABASE_URL=your-neon-connection-string-from-step-2
   DIRECT_URL=same-as-database-url
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   CLERK_SECRET_KEY=your-clerk-secret-key
   
   # Stream Chat API (optional)
   NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
   STREAM_API_SECRET=your-stream-secret-key
   
   # Next.js
   NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
   ```

4. **Create Database Tables**:
   - You don't need to manually create tables - the app will automatically create them based on the Prisma schema when first deployed
   - The schema is already defined in `prisma/schema.prisma`
   - Vercel's build process will run `prisma generate` and `prisma migrate deploy` automatically

5. **Deploy Your Application**:
   - Click "Deploy" in Vercel
   - Once deployment completes, your app will be live with the database tables created automatically

## Important Notes About the Database Schema:

1. **Tables and Relationships**:
   - **User** table connects to Issues (as reporter and assignee), Comments, and ChatMessages
   - **Project** table connects to Sprints and Issues
   - **Issue** table is the central entity connecting to Sprint, Project, User (reporter/assignee), Comments, ChatConversation, and IssueAnalytic
   - All tables have proper foreign key relationships and cascading deletes where appropriate

2. **First-Time Setup**:
   - When your app first deploys, the Prisma ORM will create all these tables automatically
   - You don't need to manually create any database structure

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your Neon connection strings in Vercel environment variables
2. Make sure `sslmode=require` is included in the connection string
3. Check if the Neon database is active and not in sleep mode

### Authentication Issues

If users cannot log in:

1. Check Clerk environment variables in Vercel
2. Verify that your production domain is allowed in Clerk dashboard
3. Check browser console for CORS errors

## Database Scaling Considerations

Neon PostgreSQL offers:
- Autoscaling compute resources
- Read replicas for high-traffic applications
- Point-in-time recovery

Consider upgrading your Neon plan for:
- Increased compute resources
- More storage
- Additional branches for staging environments

## Database Maintenance

1. Regularly back up your database (Neon provides automatic backups)
2. Monitor performance in the Neon dashboard
3. Run database migrations carefully when updating your schema:
   ```bash
   npx prisma migrate deploy
   ```

## Security Considerations

1. Keep your environment variables secure
2. Enable Two-Factor Authentication for your Neon and Vercel accounts
3. Use parameterized queries (Prisma handles this automatically)
4. Regularly update dependencies