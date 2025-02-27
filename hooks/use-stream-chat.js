"use client";

import { useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { StreamChat } from 'stream-chat';
import { getStreamChatToken } from '@/actions/chat';

export default function useStreamChat(issueId) {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  
  // First, get the token
  useEffect(() => {
    if (!userLoaded || !user) return;
    
    const fetchToken = async () => {
      try {
        const result = await getStreamChatToken();
        setToken(result.token);
      } catch (err) {
        console.error('Error fetching Stream token:', err);
        setError('Failed to get authentication token for chat.');
        setLoading(false);
      }
    };
    
    fetchToken();
  }, [user, userLoaded]);
  
  // Then initialize the chat with the token
  useEffect(() => {
    // Wait for user and org data to load and token to be fetched
    if (!userLoaded || !orgLoaded || !user || !issueId || !token) {
      return;
    }
    
    const initChat = async () => {
      try {
        setLoading(true);
        
        // Get Stream API key from env
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || 'no-api-key';
        
        // Initialize Stream Chat client
        const chatClient = StreamChat.getInstance(apiKey);
        
        // Check if already connected with the correct user
        if (chatClient.userID) {
          // If connected but with a different user, disconnect first
          if (chatClient.userID !== user.id) {
            await chatClient.disconnectUser();
          } else {
            // Already connected with the correct user
            setClient(chatClient);
            
            // Only watch the channel, don't try to create it
            const issueChannel = chatClient.channel('messaging', `issue-${issueId}`);
            
            try {
              await issueChannel.watch();
              setChannel(issueChannel);
              setLoading(false);
              return;
            } catch (error) {
              console.error('Error watching channel:', error);
              // Continue to channel initialization below
            }
          }
        }
        
        // Connect with token instead of guest user
        try {
          await chatClient.connectUser(
            {
              id: user.id,
              name: user.fullName || `${user.firstName} ${user.lastName}` || user.username,
              image: user.imageUrl
            },
            token // Use the token from server
          );
        } catch (error) {
          console.error('Error connecting user:', error);
          setError('Failed to connect to chat. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Store the client
        setClient(chatClient);
        
        // Only watch the channel, don't try to create it
        // The channel should be created server-side in actions/chat.js
        const issueChannel = chatClient.channel('messaging', `issue-${issueId}`);
        
        try {
          await issueChannel.watch();
        } catch (error) {
          console.error('Error watching channel:', error);
          // If the channel doesn't exist, we'll need to create it server-side
          // Call the server action to initialize the chat
          try {
            const response = await fetch(`/api/chat/initialize?issueId=${issueId}`, {
              method: 'POST',
            });
            
            if (!response.ok) {
              throw new Error('Failed to initialize chat channel');
            }
            
            // Try watching again after server creates the channel
            await issueChannel.watch();
          } catch (initError) {
            console.error('Error initializing chat:', initError);
            setError('Failed to initialize chat. Please try again later.');
          }
        }
        setChannel(issueChannel);
        
      } catch (err) {
        console.error('Error initializing Stream chat:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initChat();
    
    // Cleanup function
    return () => {
      const cleanup = async () => {
        if (client) {
          try {
            await client.disconnectUser();
            console.log('User disconnected from Stream');
          } catch (err) {
            console.error('Error disconnecting from Stream:', err);
          }
        }
      };
      
      cleanup();
    };
  }, [user, userLoaded, organization, orgLoaded, issueId, token]);
  
  return { client, channel, loading, error };
}
