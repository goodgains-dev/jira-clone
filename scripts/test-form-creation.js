const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testFormCreation() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database successfully');

    // Check if a project exists
    console.log('Checking for existing projects...');
    const projects = await prisma.project.findMany({
      take: 1
    });

    let projectId;
    if (projects.length > 0) {
      projectId = projects[0].id;
      console.log(`Found existing project with ID: ${projectId}`);
    } else {
      console.log('No projects found, creating a mock project');
      const newProject = await prisma.project.create({
        data: {
          name: 'Test Project',
          key: 'TEST',
          description: 'Test project for form creation',
          organizationId: 'org-1'
        }
      });
      projectId = newProject.id;
      console.log(`Created new project with ID: ${projectId}`);
    }

    // Create a test form
    console.log('Creating test form...');
    const form = await prisma.form.create({
      data: {
        name: 'Test Form',
        description: 'Test form created by script',
        fields: JSON.stringify([
          {
            label: 'Name',
            type: 'text',
            required: true
          },
          {
            label: 'Email',
            type: 'text',
            required: true
          }
        ]),
        projectId: projectId
      }
    });

    console.log('Form created successfully:', form);

    // Clean up - delete the test form
    console.log('Cleaning up - deleting test form...');
    await prisma.form.delete({
      where: {
        id: form.id
      }
    });

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFormCreation();
