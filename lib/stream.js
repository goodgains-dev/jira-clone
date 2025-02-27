"use server";

import { StreamChat } from 'stream-chat';
import { auth, clerkClient } from "@clerk/nextjs/server";

// Initialize Stream client
// Make sure to add NEXT_PUBLIC_STREAM_API_KEY to your .env file
const streamApiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;

if (!streamApiKey) {
  console.warn('Stream API key is missing. Chat functionality will not work.');
}

let streamServerClient;

// Get or initialize the Stream server client
export async function getServerClient() {
  if (!streamApiKey || !streamApiSecret) {
    console.warn('Stream API keys are missing');
    return null;
  }
  
  if (!streamServerClient) {
    streamServerClient = StreamChat.getInstance(streamApiKey, streamApiSecret);
  }
  
  return streamServerClient;
}

// For backward compatibility
export async function getStreamServerClient() {
  return await getServerClient();
}

// Create user token for Stream using Clerk user
export async function createStreamUserToken(clerkUserId) {
  const serverClient = await getServerClient();
  if (!serverClient) return null;
  
  try {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    // Make sure the user exists in Stream first
    await serverClient.upsertUser({
      id: clerkUserId,
      name: `${clerkUser.firstName} ${clerkUser.lastName}`,
      image: clerkUser.imageUrl,
    });
    
    // Create token that can be used on client
    return serverClient.createToken(clerkUserId);
  } catch (error) {
    console.error('Error creating Stream user token:', error);
    return null;
  }
}

// Upsert a user to Stream
export async function upsertStreamUser(clerkUserId) {
  const serverClient = await getStreamServerClient();
  if (!serverClient) return null;
  
  try {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    // Update or create Stream user
    await serverClient.upsertUser({
      id: clerkUserId,
      name: `${clerkUser.firstName} ${clerkUser.lastName}`,
      image: clerkUser.imageUrl,
    });
    
    return true;
  } catch (error) {
    console.error('Error upserting Stream user:', error);
    return false;
  }
}

// Create a channel for an issue
export async function createIssueChannel(issueId, title, memberClerkIds) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  
  const serverClient = await getStreamServerClient();
  if (!serverClient) return null;
  
  try {
    // Make sure all users exist in Stream
    for (const memberId of memberClerkIds) {
      await upsertStreamUser(memberId);
    }
    
    const channelId = `issue-${issueId}`;
    const channel = serverClient.channel('messaging', channelId, {
      name: `Issue: ${title}`,
      members: memberClerkIds,
      created_by_id: userId,
    });
    
    await channel.create();
    return channelId;
  } catch (error) {
    console.error('Error creating Stream channel:', error);
    return null;
  }
}
