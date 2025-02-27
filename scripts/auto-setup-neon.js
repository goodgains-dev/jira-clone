/**
 * Simplified Neon Database Setup Script
 *
 * This script guides you through manually setting up your Neon database
 * and updating your environment variables.
 *
 * Usage:
 * node scripts/auto-setup-neon.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const open = require('open');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to update .env file
function updateEnvFile(connectionString) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update DATABASE_URL and DIRECT_URL
    envContent = envContent.replace(
      /DATABASE_URL="[^"]*"/,
      `DATABASE_URL="${connectionString}"`
    );
    
    envContent = envContent.replace(
      /DIRECT_URL="[^"]*"/,
      `DIRECT_URL="${connectionString}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with Neon database connection details');
    return true;
  } catch (error) {
    console.error(`Failed to update .env file: ${error.message}`);
    return false;
  }
}

// Function to open a URL in the default browser
function openBrowser(url) {
  console.log(`Opening ${url} in your browser...`);
  
  try {
    open(url);
    return true;
  } catch (error) {
    console.log(`Failed to open browser automatically. Please visit: ${url}`);
    return false;
  }
}

// Function to apply SQL schema using Prisma
async function applySchemaWithPrisma(connectionString) {
  try {
    console.log('\n🔄 Creating database schema using Prisma...');
    
    // Temporarily update the .env file for Prisma operations
    const envPath = path.join(process.cwd(), '.env');
    const originalEnv = fs.readFileSync(envPath, 'utf8');
    
    // Update DATABASE_URL and DIRECT_URL
    let updatedEnv = originalEnv.replace(
      /DATABASE_URL="[^"]*"/,
      `DATABASE_URL="${connectionString}"`
    );
    
    updatedEnv = updatedEnv.replace(
      /DIRECT_URL="[^"]*"/,
      `DIRECT_URL="${connectionString}"`
    );
    
    fs.writeFileSync(envPath, updatedEnv);
    
    // Run Prisma commands
    console.log('Running Prisma migration...');
    
    try {
      // First try to push the schema directly
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema created with Prisma db push');
    } catch (error) {
      console.log('⚠️ Prisma db push failed, trying Prisma migrate...');
      
      try {
        execSync('npx prisma migrate dev --name initial', { stdio: 'inherit' });
        console.log('✅ Database schema created with Prisma migrate');
      } catch (migrateError) {
        console.log('⚠️ Prisma migrate failed. The database may need to be set up manually.');
        
        // Restore original .env file
        fs.writeFileSync(envPath, originalEnv);
        
        return false;
      }
    }
    
    // Generate Prisma client
    console.log('\n🔄 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.error(`❌ Error generating Prisma client: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error applying schema with Prisma: ${error.message}`);
    return false;
  }
}

// Main function to set up Neon database
async function setupNeonDatabase() {
  try {
    console.log('\n🚀 Neon Database Setup Guide\n');
    
    console.log('This script will help you set up your Neon PostgreSQL database for the Jira clone app.');
    console.log('\nStep 1: Create a Neon account and database');
    
    // Open Neon signup page
    await prompt('Press Enter to open the Neon signup page in your browser...');
    openBrowser('https://console.neon.tech/signup');
    
    console.log('\n⏳ Follow these steps in the browser:');
    console.log('1. Create a Neon account (or log in if you already have one)');
    console.log('2. Create a new project named "jira-clone" (or any name you prefer)');
    console.log('3. Once your project is created, go to the "Connection Details" tab');
    console.log('4. Select "Prisma" from the "Connection string" dropdown');
    console.log('5. Copy the entire connection string displayed\n');
    
    // Get connection string from user
    const connectionString = await prompt('Paste your Neon database connection string here: ');
    if (!connectionString || !connectionString.startsWith('postgresql://')) {
      console.error('❌ Invalid connection string. It should start with "postgresql://"');
      rl.close();
      return;
    }
    
    // Update .env file
    console.log('\n🔄 Updating your .env file with the connection details...');
    updateEnvFile(connectionString);
    
    // Apply schema using Prisma
    const schemaApplied = await applySchemaWithPrisma(connectionString);
    
    if (schemaApplied) {
      console.log('\n🎉 Your Neon database is now configured!');
    } else {
      console.log('\n⚠️ Automated schema setup failed. You will need to set up the database schema manually.');
      console.log('\nTo set up the database schema manually:');
      console.log('1. Go to the Neon console: https://console.neon.tech');
      console.log('2. Open your project');
      console.log('3. Go to the "SQL Editor" tab');
      console.log('4. Copy and paste the contents of database-schema.sql');
      console.log('5. Run the SQL to create all tables');
      
      await prompt('Press Enter to open the Neon console...');
      openBrowser('https://console.neon.tech');
    }
    
    console.log('\nNext steps:');
    console.log('1. Set up your authentication with Clerk');
    console.log('2. Update your other environment variables');
    console.log('3. Run the application: npm run dev');
    console.log('   or');
    console.log('4. Deploy your application to Vercel\n');
    
  } catch (error) {
    console.error(`\n❌ An unexpected error occurred: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the script
setupNeonDatabase().catch(console.error);