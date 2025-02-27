import { PrismaClient } from "@prisma/client";

// Use more detailed logging in development
const logLevels = process.env.NODE_ENV === 'development'
  ? ['query', 'info', 'warn', 'error']
  : ['error', 'warn'];

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: logLevels,
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

// For Next.js, use global object to maintain singleton instance
const globalForPrisma = globalThis;

// Get existing Prisma instance or create a new one
export const db = globalForPrisma.prisma ?? prismaClientSingleton();

// Save the instance to avoid multiple instantiation in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Initialize the connection
let isConnected = false;

// Function to get connected client
export async function getConnectedPrisma() {
  if (!isConnected) {
    await db.$connect();
    isConnected = true;
    console.log('Successfully connected to database');
  }
  return db;
}

// Initial connection attempt
db.$connect()
  .then(() => {
    isConnected = true;
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Don't exit in production - let the app retry
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });

// Handle cleanup on app termination
process.on('beforeExit', async () => {
  if (isConnected) {
    await db.$disconnect();
    isConnected = false;
  }
});
