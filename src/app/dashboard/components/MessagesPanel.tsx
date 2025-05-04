//src/app/dashboard/components/MessagesPanel.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { format } from 'date-fns';

const linkifyText = (text: string) => {
  // More precise regex that better handles URLs
  const urlRegex = /(https?:\/\/[^\s\n]+)/g;
  
  // Split the text by newlines first to preserve line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    let lastIndex = 0;
    const lineResult: React.ReactNode[] = [];
    const matches = [...line.matchAll(urlRegex)];
    
    // No URLs in this line, just return the text
    if (matches.length === 0) {
      return line;
    }
    
    // Process each match
    matches.forEach((match, i) => {
      if (!match.index) return;
      
      // Add text before the URL
      if (match.index > lastIndex) {
        lineResult.push(line.substring(lastIndex, match.index));
      }
      
      // Add the URL as a link
      lineResult.push(
        <a 
          key={`${lineIndex}-${i}`}
          href={match[0]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {match[0]}
        </a>
      );
      
      // Update lastIndex to after this URL
      lastIndex = match.index + match[0].length;
    });
    
    // Add any remaining text after the last URL
    if (lastIndex < line.length) {
      lineResult.push(line.substring(lastIndex));
    }
    
    return lineResult;
  }).reduce((acc: React.ReactNode[], line, i, arr) => {
    // Handle both string and array types for line
    if (typeof line === 'string') {
      acc.push(line);
    } else {
      acc.push(...line);
    }
    
    // Add a line break after each line except the last one
    if (i < arr.length - 1) {
      acc.push(<br key={`br-${i}`} />);
    }
    return acc;
  }, []);
};

type Message = {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    author_name?: string;
  };
  

type MessagesPanelProps = {
  isHost: boolean;
};

export default function MessagesPanel({ isHost }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
        try {
          setLoading(true);
          
          const { data, error } = await supabase
            .from('messages')
            .select('*, profiles:author_id(username)')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (error) throw error;
          
          const transformedMessages = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            author_id: msg.author_id,
            author_name: msg.profiles?.username
          }));
          
          setMessages(transformedMessages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };
    
    fetchMessages();
    
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchMessages();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  const toggleMessageExpansion = (id: string) => {
    const newExpandedMessages = new Set(expandedMessages);
    if (newExpandedMessages.has(id)) {
      newExpandedMessages.delete(id);
    } else {
      newExpandedMessages.add(id);
    }
    setExpandedMessages(newExpandedMessages);
  };

  const handleEdit = (message: Message) => {
    setCurrentMessage(message);
    setEditContent(message.content);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!currentMessage) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: editContent
        })
        .eq('id', currentMessage.id);
        
      if (error) throw error;
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentMessage) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', currentMessage.id);
        
      if (error) throw error;
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const truncateMessage = (content: string, isExpanded: boolean) => {
    if (isExpanded) return linkifyText(content);
    
    // For truncated content, preserve the first 150 characters
    // but make sure we don't cut in the middle of a URL
    if (content.length > 150) {
      let truncated = content.substring(0, 150);
      // If we cut in the middle of a URL, find the last space before the cut
      const lastHttpIndex = truncated.lastIndexOf('http');
      if (lastHttpIndex > -1 && !truncated.includes(' ', lastHttpIndex)) {
        // Find the last space before the URL
        const lastSpaceBeforeUrl = truncated.lastIndexOf(' ', lastHttpIndex);
        if (lastSpaceBeforeUrl > -1) {
          truncated = truncated.substring(0, lastSpaceBeforeUrl);
        }
      }
      return linkifyText(truncated + '...');
    }
    
    return linkifyText(content);
  };


  const handleAddMessage = async () => {
    if (!newMessageContent.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessageContent,
          author_id: user.id
        });
        
      if (error) throw error;
      
      setShowAddModal(false);
      setNewMessageContent('');
      
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };
  return (
    <div className="space-y-2">
      {/* Add "New Message" button for hosts at the top */}
      {isHost && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Message
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : messages.length > 0 ? (
        messages.map(message => (
            <div 
            key={message.id} 
            className="p-4 rounded bg-gray-50 dark:bg-gray-700"
            >
            <div className="flex justify-between items-start">
                <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {message.author_name || "Unknown"}
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(message.created_at), 'MMM dd, yyyy')}
                </span>
                </div>
              
              {isHost && (
                <button 
                  onClick={() => handleEdit(message)}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {truncateMessage(message.content, expandedMessages.has(message.id))}
            </div>
            
            {message.content.length > 150 && (
              <button 
                onClick={() => toggleMessageExpansion(message.id)}
                className="mt-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {expandedMessages.has(message.id) ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No messages found</p>
      )}
      
      {/* Edit Message Modal */}
      {showEditModal && currentMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Message</h3>
            
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 mb-4"
              rows={5}
            />
            
            <div className="flex justify-between">
              <div>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
              
              <div className="space-x-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!editContent.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Message Modal */}
        {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">New Message</h3>
            
            <textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 mb-4"
                rows={5}
                placeholder="Enter your message here..."
            />
            
            <div className="flex justify-end space-x-2">
                <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                Cancel
                </button>
                
                <button
                onClick={handleAddMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!newMessageContent.trim()}
                >
                Post Message
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );
}