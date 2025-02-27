// Test script for department functionality
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDepartments() {
  console.log('='.repeat(50));
  console.log('DEPARTMENT FUNCTIONALITY TEST');
  console.log('='.repeat(50));
  
  try {
    // 1. Get a test organization and project
    console.log('\n1. Finding a test project...');
    const project = await prisma.project.findFirst({
      select: {
        id: true,
        name: true,
        organizationId: true
      }
    });
    
    if (!project) {
      console.error('No projects found in the database. Please create a project first.');
      return;
    }
    
    console.log(`✅ Using project: ${project.name} (${project.id})`);
    console.log(`   Organization ID: ${project.organizationId}`);
    
    // 2. Create a test department
    console.log('\n2. Creating a test department...');
    const departmentName = `Test Department ${Date.now()}`;
    const department = await prisma.department.create({
      data: {
        name: departmentName,
        description: 'This is a test department created by the test script',
        projectId: project.id
      }
    });
    
    console.log(`✅ Department created: ${department.name} (${department.id})`);
    
    // 3. Verify department was created
    const createdDepartment = await prisma.department.findUnique({
      where: { id: department.id }
    });
    
    if (!createdDepartment) {
      throw new Error('Failed to retrieve the created department');
    }
    
    console.log(`✅ Department successfully created and retrieved`);
    
    // 4. Create an issue with the department
    console.log('\n3. Creating a test issue with the department...');
    
    // Find a user to use as reporter
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      return;
    }
    
    const issue = await prisma.issue.create({
      data: {
        title: `Test Issue with Department ${Date.now()}`,
        description: 'This is a test issue with a department assignment',
        status: 'TODO',
        priority: 'MEDIUM',
        order: 0,
        projectId: project.id,
        reporterId: user.id,
        departmentId: department.id
      },
      include: {
        department: true
      }
    });
    
    console.log(`✅ Issue created: ${issue.title} (${issue.id})`);
    console.log(`✅ Issue department: ${issue.department.name} (${issue.department.id})`);
    
    // 5. Update the department
    console.log('\n4. Updating the department...');
    const updatedName = `${departmentName} - Updated`;
    const updatedDepartment = await prisma.department.update({
      where: { id: department.id },
      data: {
        name: updatedName,
        description: 'This department has been updated'
      }
    });
    
    console.log(`✅ Department updated: ${updatedDepartment.name}`);
    
    // 6. Get all departments for the project
    console.log('\n5. Getting all departments for the project...');
    const departments = await prisma.department.findMany({
      where: { projectId: project.id }
    });
    
    console.log(`✅ Found ${departments.length} departments for the project`);
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.id})`);
    });
    
    // 7. Clean up (optional - comment out if you want to keep the test data)
    console.log('\n6. Cleaning up test data...');
    await prisma.issue.delete({
      where: { id: issue.id }
    });
    
    await prisma.department.delete({
      where: { id: department.id }
    });
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n='.repeat(25));
    console.log('TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(25));
  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDepartments();
