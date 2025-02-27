// Simple script to test database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Try to get a count of projects
    const projectCount = await prisma.project.count();
    console.log(`Connection successful! Found ${projectCount} projects.`);
    
    // Try to get a count of departments
    const departmentCount = await prisma.department.count();
    console.log(`Found ${departmentCount} departments.`);
    
    // Try to get a count of users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users.`);
    
    console.log('Database connection test completed successfully.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
