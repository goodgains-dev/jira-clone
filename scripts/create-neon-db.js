/**
 * Neon Database Creation Helper Script
 * 
 * This script helps you:
 * 1. Sign up for a Neon account (opens browser)
 * 2. Create a new PostgreSQL database
 * 3. Extract connection details
 * 4. Update your .env file automatically
 * 
 * Usage:
 * node scripts/create-neon-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to open a URL in the default browser
function openBrowser(url) {
  const command = process.platform === 'win32' 
    ? `start ${url}` 
    : process.platform === 'darwin' 
    ? `open ${url}` 
    : `xdg-open ${url}`;
  
  try {
    execSync(command);
    return true;
  } catch (error) {
    console.error(`Failed to open browser: ${error.message}`);
    return false;
  }
}

// Function to update the .env file with new connection strings
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
    console.log('✅ .env file updated successfully with your Neon database connection details!');
    return true;
  } catch (error) {
    console.error(`Failed to update .env file: ${error.message}`);
    return false;
  }
}

// Main function to run the script
async function createNeonDatabase() {
  console.log('\n🚀 Neon Database Setup Helper\n');
  
  console.log('Step 1: Sign up for a Neon account (if you don\'t have one)\n');
  
  // Open Neon signup page
  console.log('Opening Neon signup page in your browser...');
  const browserOpened = openBrowser('https://console.neon.tech/signup');
  
  if (!browserOpened) {
    console.log('\nPlease manually visit: https://console.neon.tech/signup');
  }
  
  console.log('\n⏳ Follow these steps in the browser:');
  console.log('1. Create a Neon account (or log in if you already have one)');
  console.log('2. Create a new project');
  console.log('3. Once your project is created, go to the "Connection Details" tab');
  console.log('4. Select "Prisma" from the "Connection string" dropdown');
  console.log('5. Copy the entire connection string displayed\n');
  
  // Get connection string from user
  rl.question('Paste your Neon database connection string here: ', (connectionString) => {
    if (!connectionString || !connectionString.startsWith('postgresql://')) {
      console.error('❌ Invalid connection string. It should start with "postgresql://"');
      rl.close();
      return;
    }
    
    console.log('\n⚙️ Updating your .env file with the connection details...');
    const updated = updateEnvFile(connectionString);
    
    if (updated) {
      console.log('\n🎉 Your Neon database is now configured!');
      console.log('\nNext steps:');
      console.log('1. Run the database setup script: npm run setup-db');
      console.log('2. Start the application: npm run dev\n');
    }
    
    rl.close();
  });
}

// Run the script
createNeonDatabase().catch(console.error);