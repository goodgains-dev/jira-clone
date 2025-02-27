const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

async function testConnection() {
  try {
    // Test the connection
    await db.$connect();
    console.log('✅ Database connection successful');

    // Get counts from each table to verify schema
    const counts = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.sprint.count(),
      db.issue.count()
    ]);

    console.log('\nTable counts:');
    console.log('Users:', counts[0]);
    console.log('Projects:', counts[1]);
    console.log('Sprints:', counts[2]);
    console.log('Issues:', counts[3]);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testConnection();