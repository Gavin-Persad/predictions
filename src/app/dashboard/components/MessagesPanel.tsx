//src/app/dashboard/components/MessagesPanel.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { format } from 'date-fns';

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

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
        try {
          setLoading(true);
          
          // Get messages, ordered by most recent
          const { data, error } = await supabase
            .from('messages')
            .select('*, profiles:author_id(username)')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (error) throw error;
          
          // Transform the data to include the author_name
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
    
    // Set up subscription for real-time updates
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

  // Toggle message expansion
  const toggleMessageExpansion = (id: string) => {
    const newExpandedMessages = new Set(expandedMessages);
    if (newExpandedMessages.has(id)) {
      newExpandedMessages.delete(id);
    } else {
      newExpandedMessages.add(id);
    }
    setExpandedMessages(newExpandedMessages);
  };

  // Open edit modal
  const handleEdit = (message: Message) => {
    setCurrentMessage(message);
    setEditContent(message.content);
    setShowEditModal(true);
  };

  // Save edited message
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
      
      // Close modal and let the subscription handle the refresh
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // Delete message
  const handleDelete = async () => {
    if (!currentMessage) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', currentMessage.id);
        
      if (error) throw error;
      
      // Close modal and let the subscription handle the refresh
      setShowEditModal(false);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const truncateMessage = (content: string, isExpanded: boolean) => {
    if (isExpanded) return content;
    return content.length > 150 ? `${content.substring(0, 150)}...` : content;
  };

  const handleAddMessage = async () => {
    if (!newMessageContent.trim()) return;
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessageContent,
          author_id: user.id
        });
        
      if (error) throw error;
      
      // Close modal and reset form
      setShowAddModal(false);
      setNewMessageContent('');
      
      // Data will refresh via the subscription
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