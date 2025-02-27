/**
 * Vercel Environment Setup Script
 * 
 * This script helps set up environment variables in your Vercel project
 * using the Vercel CLI. It reads from .env.vercel and prompts for any
 * missing values before applying them to your Vercel project.
 * 
 * Prerequisites:
 * - Vercel CLI installed (npm i -g vercel)
 * - Logged in to Vercel CLI (vercel login)
 * - Project already created in Vercel
 * 
 * Usage:
 * node scripts/setup-vercel-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

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

// Function to check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get Vercel projects
function getVercelProjects() {
  try {
    const output = execSync('vercel project ls --json', { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('Error getting Vercel projects:', error.message);
    return [];
  }
}

// Main function
async function setupVercelEnv() {
  console.log('\n🚀 Vercel Environment Setup\n');
  
  // Check if .env.vercel file exists
  const envPath = path.join(process.cwd(), '.env.vercel');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.vercel file not found. Please create it first.');
    rl.close();
    return;
  }
  
  // Check Vercel CLI
  if (!checkVercelCLI()) {
    console.error('❌ Vercel CLI not found. Please install it with: npm i -g vercel');
    rl.close();
    return;
  }
  
  // Get Vercel projects
  console.log('📋 Fetching your Vercel projects...');
  const projects = getVercelProjects();
  
  if (projects.length === 0) {
    console.error('❌ No Vercel projects found. Please create a project first or log in to Vercel CLI.');
    rl.close();
    return;
  }
  
  // List projects
  console.log('\nAvailable projects:');
  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name}`);
  });
  
  // Select project
  const projectIndex = await prompt('\nSelect a project (enter number): ');
  const selectedProject = projects[parseInt(projectIndex) - 1];
  
  if (!selectedProject) {
    console.error('❌ Invalid project selection.');
    rl.close();
    return;
  }
  
  console.log(`\n✅ Selected project: ${selectedProject.name}`);
  
  // Read .env.vercel file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  // Parse .env.vercel file
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      return;
    }
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      // Only add non-empty values and those not using ${} syntax
      if (value && !value.includes('${')) {
        envVars[key] = value;
      }
    }
  });
  
  // Prompt for missing values
  console.log('\n📝 Please provide values for required environment variables:');
  
  // Check for required variables
  if (!envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_live_your_clerk_publishable_key') {
    envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = await prompt('Clerk Publishable Key: ');
  }
  
  if (!envVars.CLERK_SECRET_KEY || envVars.CLERK_SECRET_KEY === 'sk_live_your_clerk_secret_key') {
    envVars.CLERK_SECRET_KEY = await prompt('Clerk Secret Key: ');
  }
  
  if (!envVars.NEXT_PUBLIC_APP_URL || envVars.NEXT_PUBLIC_APP_URL === 'https://your-app-name.vercel.app') {
    envVars.NEXT_PUBLIC_APP_URL = `https://${selectedProject.name}.vercel.app`;
    console.log(`NEXT_PUBLIC_APP_URL set to: ${envVars.NEXT_PUBLIC_APP_URL}`);
  }
  
  // Optional: Stream Chat API keys
  const useStream = await prompt('Do you want to set up Stream Chat? (y/n): ');
  if (useStream.toLowerCase() === 'y') {
    envVars.NEXT_PUBLIC_STREAM_API_KEY = await prompt('Stream API Key: ');
    envVars.STREAM_API_SECRET = await prompt('Stream API Secret: ');
  }
  
  // Set environment variables in Vercel
  console.log('\n🔄 Setting environment variables in Vercel...');
  
  try {
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        console.log(`Setting ${key}...`);
        execSync(`vercel env add ${key} ${selectedProject.name}`, { stdio: 'inherit' });
        // The command will prompt for the value interactively
      }
    }
    
    console.log('\n✅ Environment variables set in Vercel project!');
    console.log('\nNext steps:');
    console.log('1. Deploy your project: vercel deploy');
    console.log('2. Set up your Neon database via Vercel Storage');
    console.log('3. Verify all settings in the Vercel dashboard');
  } catch (error) {
    console.error('\n❌ Error setting environment variables:', error.message);
  }
  
  rl.close();
}

// Run the script
setupVercelEnv().catch(console.error);