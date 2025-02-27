const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Try to connect to the database
    console.log('Connecting to Neon database...');
    await prisma.$connect();
    console.log('Connected successfully!');
    
    // Run a simple query
    const usersCount = await prisma.user.count();
    console.log(`Number of users in database: ${usersCount}`);
    
    // Display project count
    const projectsCount = await prisma.project.count();
    console.log(`Number of projects in database: ${projectsCount}`);
    
    // Display issue count
    const issuesCount = await prisma.issue.count();
    console.log(`Number of issues in database: ${issuesCount}`);
    
    console.log('Neon database connection test successful!');
  } catch (error) {
    console.error('Error connecting to Neon database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();