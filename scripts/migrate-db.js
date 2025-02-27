/**
 * Database Migration Script
 * 
 * This script runs the Prisma migration to update the database schema with the new models:
 * - Comment
 * - ChatConversation
 * - ChatMessage
 * - IssueAnalytic
 * 
 * Prerequisites:
 * 1. Neon database setup with connection string in .env file
 * 2. Prisma schema updated with the new models
 * 
 * Usage:
 * node scripts/migrate-db.js
 */

const { execSync } = require('child_process');

async function runMigration() {
  try {
    console.log('\n🔍 Checking environment...');
    
    // Verify DATABASE_URL exists
    const hasEnv = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!hasEnv) {
      console.error('\n❌ DATABASE_URL not found in environment');
      console.log('Please ensure your .env file contains your Neon database connection string:');
      console.log('DATABASE_URL="postgresql://[username]:[password]@[neon-hostname]/[database]?sslmode=require"');
      process.exit(1);
    }

    console.log('\n⚙️ Creating migration for new models...');
    execSync('npx prisma migrate dev --name add_chat_comments_analytics', {
      stdio: 'inherit',
    });
    
    console.log('\n🔄 Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew models added to database:');
    console.log('- Comment: For issue comments');
    console.log('- ChatConversation: For chat between assignee and reporter');
    console.log('- ChatMessage: For individual chat messages');
    console.log('- IssueAnalytic: For tracking issue performance metrics');
    
  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    process.exit(1);
  }
}

runMigration();