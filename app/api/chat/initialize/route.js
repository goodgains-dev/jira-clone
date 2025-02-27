import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { createIssueChannel, getServerClient } from '@/lib/stream';

export async function POST(request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the issue ID from the query parameters
  const { searchParams } = new URL(request.url);
  const issueId = searchParams.get('issueId');
  
  if (!issueId) {
    return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
  }
  
  try {
    // Get the issue with assignee and reporter
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: true,
        reporter: true,
        conversation: true,
      },
    });
    
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }
    
    // Check if we already have a conversation with a Stream channel
    if (issue.conversation?.streamChannelId) {
      return NextResponse.json({ 
        success: true,
        channelId: issue.conversation.streamChannelId 
      });
    }
    
    // We need both an assignee and a reporter for a chat
    if (!issue.assignee) {
      return NextResponse.json({ 
        error: 'Issue must have an assignee to start a chat' 
      }, { status: 400 });
    }
    
    // Create Stream channel
    const members = [issue.reporter.clerkUserId];
    if (issue.assignee) {
      members.push(issue.assignee.clerkUserId);
    }
    
    const streamChannelId = await createIssueChannel(
      issueId,
      issue.title,
      members
    );
    
    if (!streamChannelId) {
      return NextResponse.json({ 
        error: 'Failed to create Stream channel' 
      }, { status: 500 });
    }
    
    // Create or update chat conversation in database
    let conversation = issue.conversation;
    
    if (conversation) {
      conversation = await db.chatConversation.update({
        where: { id: conversation.id },
        data: { streamChannelId },
      });
    } else {
      conversation = await db.chatConversation.create({
        data: {
          issueId,
          streamChannelId,
        },
      });
    }
    
    return NextResponse.json({ 
      success: true,
      channelId: streamChannelId 
    });
    
  } catch (error) {
    console.error('Error initializing chat:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize chat' 
    }, { status: 500 });
  }
}
