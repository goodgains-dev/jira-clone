/**
 * Extract SQL Statements for Neon Console
 * 
 * This script reads the database-schema.sql file and outputs
 * the SQL statements in a format ready for copy-pasting into
 * the Neon SQL Editor console.
 * 
 * Usage:
 * node scripts/get-sql-for-neon.js
 */

const fs = require('fs');
const path = require('path');

// Path to the SQL schema file
const sqlFilePath = path.join(process.cwd(), 'database-schema.sql');

// Function to read and format SQL
function formatSqlForConsole() {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('\n=== Neon Database SQL Setup ===\n');
    console.log('Copy and paste the following SQL statements into the Neon SQL Editor console:\n');
    
    // Output the SQL content
    console.log(sqlContent);
    
    console.log('\n=== Instructions ===\n');
    console.log('1. Go to your Neon console: https://console.neon.tech');
    console.log('2. Select your project');
    console.log('3. Click on "SQL Editor" in the sidebar');
    console.log('4. Copy and paste ALL the SQL statements above');
    console.log('5. Click "Run" to execute the SQL and create your tables');
    console.log('\nAfter creating the tables, update your .env file with your Neon connection string:\n');
    console.log('DATABASE_URL="postgresql://user:password@hostname/database?sslmode=require"');
    console.log('DIRECT_URL="postgresql://user:password@hostname/database?sslmode=require"');
    
  } catch (error) {
    console.error(`Error reading SQL file: ${error.message}`);
  }
}

// Run the function
formatSqlForConsole();