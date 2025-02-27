# Deployment Guide: Jira Clone Web Application

This guide provides detailed instructions for deploying the Jira clone application to the web using Vercel and Neon PostgreSQL.

## Prerequisites

Before starting the deployment process, ensure you have:

1. A GitHub account with your project code pushed to a repository
2. A [Vercel account](https://vercel.com/signup) (you can sign up with your GitHub account)
3. A [Neon account](https://neon.tech) for PostgreSQL database hosting
4. A [Clerk account](https://clerk.dev) for authentication
5. A [Stream account](https://getstream.io) for chat functionality (optional but recommended)

## Step 1: Set Up Neon Database for Production

1. Log in to your Neon account at https://console.neon.tech
2. Create a new project (if you haven't already)
3. In your project dashboard, note the connection details:
   - Connection string
   - Host
   - Database name
   - Username
   - Password
4. Create a new branch for production (optional but recommended)
   - Click on "Branches" in the sidebar
   - Click "New Branch"
   - Name it "production"
   - This will be your production database branch
5. Run the setup script to initialize your schema on Neon:
   ```bash
   # Install dotenv if not already installed
   npm install dotenv
   
   # Run the setup script
   node scripts/setup-neon-db.js
   ```

## Step 2: Set Up Vercel for Deployment

1. Log in to Vercel at https://vercel.com
2. Click "Add New" → "Project"
3. Select your GitHub repository containing the Jira clone code
4. Configure your project settings:
   - Framework Preset: Next.js
   - Root Directory: ./ (or your project root)
   - Build Command: (leave as default)
   - Install Command: npm install
   - Output Directory: (leave as default)

## Step 3: Configure Environment Variables in Vercel

Add the following environment variables in the Vercel project settings:

```
# Database - Neon PostgreSQL
DATABASE_URL=postgresql://postgres:your-password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://postgres:your-password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-clerk-publishable-key
CLERK_SECRET_KEY=sk_live_your-clerk-secret-key

# Stream Chat API (for real-time chat)
NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-secret-key

# Next.js
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

**Important**: 
- Use your production Clerk API keys (not test keys)
- Make sure your Neon database connection strings use `sslmode=require`
- Set NEXT_PUBLIC_APP_URL to your Vercel deployment URL (you can update this after the first deployment)

## Step 4: Deploy the Application

1. Click "Deploy" in the Vercel dashboard
2. Wait for the build and deployment process to complete
3. Once deployed, Vercel will provide you with a URL to access your application

## Step 5: Post-Deployment Configuration

### Set Up Custom Domain (Optional)

1. In your Vercel project settings, go to "Domains"
2. Add your custom domain and follow the instructions for DNS configuration

### Configure Clerk Allowed URLs

1. Log in to your Clerk dashboard
2. Go to your application settings
3. Under "JWT Templates", add your Vercel deployment URL (and custom domain if applicable)
4. Under "Allowed URLs", add:
   - Your Vercel deployment URL
   - Your custom domain (if applicable)
   - Any other domains that should be able to authenticate

### Verify Stream Chat Integration

1. Log in to your Stream dashboard
2. Go to your Chat application
3. Under "App Settings", verify that your production domain is in the list of authorized domains

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify your Neon connection strings in Vercel environment variables
2. Make sure `sslmode=require` is included in the connection string
3. Check if the Neon database is active and not in sleep mode
4. Verify IP restrictions in Neon if you've set any

### Authentication Issues

If users cannot log in:

1. Check Clerk environment variables in Vercel
2. Verify that your production domain is allowed in Clerk dashboard
3. Check browser console for CORS errors

### Chat Functionality Issues

If chat doesn't work:

1. Verify Stream API keys in Vercel environment variables
2. Check browser console for Stream connection errors
3. Verify that your production domain is authorized in Stream dashboard

## Scaling Considerations

### Database Scaling

Neon PostgreSQL offers:
- Autoscaling compute resources
- Read replicas for high-traffic applications
- Point-in-time recovery

Consider upgrading your Neon plan for:
- Increased compute resources
- More storage
- Additional branches for staging environments

### Vercel Scaling

Vercel automatically scales based on traffic, but consider:
- Upgrading to a Team or Enterprise plan for:
  - More concurrent builds
  - Preview deployments
  - Faster builds
  - Analytics

## Maintenance and Updates

### Regular Updates

1. Keep dependencies updated:
   ```bash
   npm outdated
   npm update
   ```

2. Deploy changes:
   - Push changes to your GitHub repository
   - Vercel will automatically deploy the updates

### Database Maintenance

1. Regularly back up your database
2. Monitor performance in the Neon dashboard
3. Run database migrations carefully:
   ```bash
   npx prisma migrate deploy
   ```

## Monitoring

1. Set up Vercel Analytics for:
   - Performance monitoring
   - Usage statistics
   - Error reporting

2. Consider adding:
   - Sentry for error tracking
   - DataDog or New Relic for performance monitoring
   - Uptime monitoring through UptimeRobot or similar services

## Security Considerations

1. Keep your environment variables secure
2. Regularly update dependencies
3. Enable Two-Factor Authentication for:
   - Vercel account
   - GitHub account
   - Neon account
   - Clerk account
   - Stream account

## Conclusion

Your Jira clone application should now be successfully deployed to the web using Vercel and a Neon PostgreSQL database. The application is scalable and ready for production use.

If you encounter any issues or need assistance, refer to the documentation for [Vercel](https://vercel.com/docs), [Neon](https://neon.tech/docs), [Clerk](https://clerk.dev/docs), and [Stream](https://getstream.io/chat/docs/).