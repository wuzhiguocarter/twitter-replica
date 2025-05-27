import React, { useState } from 'react';
import { Search, Edit, ArrowLeft, Send } from 'lucide-react';
import { mockConversations } from '../data/mockData';
import { ConversationType, MessageType } from '../types';
import { formatDistanceToNow } from '../utils/formatters';

export const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationType[]>(mockConversations);
  const [activeConversation, setActiveConversation] = useState<ConversationType | null>(
    conversations.find(conv => conv.isActive) || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: ConversationType) => {
    // Mark all messages as read
    const updatedConversation = {
      ...conversation,
      messages: conversation.messages.map(msg => ({ ...msg, isRead: true })),
      unreadCount: 0,
      isActive: true
    };
    
    // Update conversations list
    setConversations(conversations.map(conv => 
      conv.id === conversation.id 
        ? updatedConversation 
        : { ...conv, isActive: false }
    ));
    
    setActiveConversation(updatedConversation);
    setShowConversationList(false);
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    const newMsg: MessageType = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true,
      isSent: true
    };
    
    const updatedConversation = {
      ...activeConversation,
      messages: [...activeConversation.messages, newMsg],
      lastMessageTimestamp: newMsg.timestamp
    };
    
    setConversations(conversations.map(conv => 
      conv.id === activeConversation.id ? updatedConversation : conv
    ));
    
    setActiveConversation(updatedConversation);
    setNewMessage('');
  };

  // Handle back button in mobile view
  const handleBackToList = () => {
    setShowConversationList(true);
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      
      <div className="flex-grow flex overflow-hidden">
        {/* Conversation List - Hidden on mobile when viewing a conversation */}
        <div className={`${showConversationList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-2/5 border-r border-gray-200 dark:border-gray-800`}>
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Direct Messages"
                className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-800 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400" size={18} />
            </div>
          </div>
          
          {/* Conversation list */}
          <div className="flex-grow overflow-y-auto">
            {filteredConversations.length > 0 ? (
              filteredConversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className={`p-4 hover-card flex items-start cursor-pointer ${conversation.isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <img 
                    src={conversation.participant.avatar} 
                    alt={conversation.participant.name} 
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="font-bold truncate">{conversation.participant.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(conversation.lastMessageTimestamp))}
                      </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm truncate">
                      {conversation.participant.handle}
                    </div>
                    <div className="text-sm truncate mt-1">
                      {conversation.messages[conversation.messages.length - 1]?.content}
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No conversations found
              </div>
            )}
          </div>
          
          {/* New message button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button className="btn-primary w-full flex items-center justify-center">
              <Edit size={18} className="mr-2" />
              <span>New Message</span>
            </button>
          </div>
        </div>
        
        {/* Conversation Detail */}
        <div className={`${!showConversationList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-3/5 h-full`}>
          {activeConversation ? (
            <>
              {/* Conversation header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <button 
                  className="md:hidden p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                  onClick={handleBackToList}
                >
                  <ArrowLeft size={20} />
                </button>
                <img 
                  src={activeConversation.participant.avatar} 
                  alt={activeConversation.participant.name} 
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <div className="font-bold">{activeConversation.participant.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {activeConversation.participant.handle}
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {activeConversation.messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isSent && (
                      <img 
                        src={activeConversation.participant.avatar} 
                        alt={activeConversation.participant.name} 
                        className="w-10 h-10 rounded-full mr-3 self-end"
                      />
                    )}
                    <div 
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        message.isSent 
                          ? 'bg-blue-500 text-white rounded-br-none' 
                          : 'bg-gray-200 dark:bg-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          message.isSent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2">
                  <textarea
                    placeholder="Start a new message"
                    className="flex-grow bg-transparent resize-none max-h-32 focus:outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={1}
                  />
                  <button 
                    className={`ml-2 p-2 rounded-full ${
                      newMessage.trim() 
                        ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20' 
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="mb-4">
                <Edit size={48} className="mx-auto text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                You don't have a message selected
              </h3>
              <p className="max-w-sm">
                Choose one from your existing messages, or start a new conversation.
              </p>
              <button className="btn-primary mt-4">
                New Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
