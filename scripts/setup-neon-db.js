/**
 * Neon Database Setup Script
 * 
 * This script sets up a Neon PostgreSQL database for the Jira clone application.
 * It performs the following steps:
 * 1. Validates database connection credentials
 * 2. Creates the database schema
 * 3. Applies all migrations
 * 4. Generates the Prisma client
 * 
 * Prerequisites:
 * - Neon account and database created
 * - DATABASE_URL and DIRECT_URL in .env file
 * 
 * Usage:
 * node scripts/setup-neon-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function setupNeonDatabase() {
  console.log('\n🚀 Starting Neon database setup...');
  
  // Check for required environment variables
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!dbUrl || !directUrl) {
    console.error('\n❌ DATABASE_URL or DIRECT_URL not found in .env file');
    console.log(
      'Please create a .env file with the following variables from your Neon dashboard:'
    );
    console.log('DATABASE_URL="postgresql://[username]:[password]@[neon-host]/[database]?sslmode=require"');
    console.log('DIRECT_URL="postgresql://[username]:[password]@[neon-host]/[database]?sslmode=require"');
    console.log('\nYou can create a Neon database at: https://neon.tech');
    process.exit(1);
  }
  
  try {
    // Step 1: Test database connection
    console.log('\n🔍 Testing database connection...');
    try {
      execSync('npx prisma db pull', { stdio: 'inherit' });
      console.log('✅ Database connection successful!');
    } catch (error) {
      console.error('\n❌ Database connection failed');
      console.error('Please check your Neon database credentials in the .env file');
      console.error('Error details:', error.message);
      process.exit(1);
    }

    // Step 2: Push the schema to the database
    console.log('\n📝 Creating database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Schema created successfully!');
    } catch (error) {
      console.error('\n❌ Failed to create schema');
      console.error('Error details:', error.message);
      process.exit(1);
    }

    // Step 3: Apply migrations
    console.log('\n🔄 Applying migrations...');
    try {
      execSync('npx prisma migrate dev --name initial', { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed');
      console.error('Error details:', error.message);
      
      // Try to recover by resetting the database and trying again
      console.log('\n🔄 Attempting recovery by resetting the database...');
      try {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        execSync('npx prisma migrate dev --name initial', { stdio: 'inherit' });
        console.log('✅ Recovery successful!');
      } catch (recoveryError) {
        console.error('\n❌ Recovery failed');
        console.error('You may need to recreate your Neon database instance');
        process.exit(1);
      }
    }

    // Step 4: Generate Prisma Client
    console.log('\n⚙️ Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated successfully!');
    } catch (error) {
      console.error('\n❌ Failed to generate Prisma client');
      console.error('Error details:', error.message);
      process.exit(1);
    }
    
    // Step 5: Create seed data (optional)
    const createSeedData = false;  // Set to true if you want seed data
    if (createSeedData) {
      console.log('\n🌱 Creating seed data...');
      try {
        execSync('npx prisma db seed', { stdio: 'inherit' });
        console.log('✅ Seed data created successfully!');
      } catch (error) {
        console.error('\n❌ Failed to create seed data');
        console.error('Error details:', error.message);
        // Continue even if seed data creation fails
      }
    }

    console.log('\n✅ Neon database setup completed successfully!');
    console.log('\nYour database is now ready for use with the Jira clone application.');
    console.log('\nTo start the application, run:');
    console.log('npm run dev');
    
  } catch (error) {
    console.error('\n❌ An unexpected error occurred during database setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupNeonDatabase().catch(console.error);