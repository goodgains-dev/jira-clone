"use client";

import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { useUser } from '@clerk/nextjs';
// Temporarily disable CSS import due to build issues
// import 'stream-chat-react/dist/css/v2/index.css';

export default function StreamChatProvider({ children, authToken }) {
  const { user, isLoaded } = useUser();
  const [chatClient, setChatClient] = useState(null);
  
  useEffect(() => {
    if (!isLoaded || !user || !authToken) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.warn('Stream API key is missing');
      return;
    }

    // Initialize Stream Client
    const client = StreamChat.getInstance(apiKey);
    
    const initializeChat = async () => {
      // Check if already connected with the correct user
      if (client.userID) {
        // If connected but with a different user, disconnect first
        if (client.userID !== user.id) {
          try {
            await client.disconnectUser();
          } catch (error) {
            console.error('Error disconnecting previous user:', error);
          }
        } else {
          // Already connected with the correct user
          setChatClient(client);
          return;
        }
      }
      
      // Connect the user using the token from server
      try {
        await client.connectUser(
          {
            id: user.id,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            image: user.imageUrl,
          },
          authToken // Token generated from server
        );
        
        setChatClient(client);
      } catch (error) {
        console.error('Error connecting user to Stream chat:', error);
      }
    };
    
    initializeChat();

    return () => {
      // Cleanup - disconnect when component unmounts
      if (client) {
        client.disconnectUser().then(() => {
          console.log('User disconnected from Stream');
        });
      }
    };
  }, [isLoaded, user, authToken]);

  if (!chatClient) {
    // If children is a function, pass null as the client
    if (typeof children === 'function') {
      return <>{children(null)}</>;
    }
    return <>{children}</>;
  }

  return (
    <Chat client={chatClient} theme="messaging light">
      {typeof children === 'function' ? children(chatClient) : children}
    </Chat>
  );
}
