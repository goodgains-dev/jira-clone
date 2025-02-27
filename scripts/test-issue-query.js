// Test script to check if we can query issues with departments
const { PrismaClient } = require('@prisma/client');

async function testIssueQuery() {
  console.log('Testing issue query with department...');
  
  const prisma = new PrismaClient();
  
  try {
    // Try to query issues with departments
    const issues = await prisma.issue.findMany({
      include: {
        department: true
      }
    });
    
    console.log(`Query successful! Found ${issues.length} issues.`);
    
    // Check if departmentId field exists
    if (issues.length > 0) {
      console.log('Sample issue:', {
        id: issues[0].id,
        title: issues[0].title,
        departmentId: issues[0].departmentId,
        hasDepartment: issues[0].department !== null
      });
    }
    
    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error querying issues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIssueQuery();
