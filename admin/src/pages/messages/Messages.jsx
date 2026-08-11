import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Send, Image as ImageIcon, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ⚠️ IMPORTANT: change this to your actual backend server URL
// e.g. 'http://localhost:5000' in dev, or your production API domain
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeConversationRef = useRef(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // ---- Setup socket connection ----
  useEffect(() => {
    socket = io(SOCKET_URL, { withCredentials: true });

    socket.emit('join_admin_room');

    socket.on('receive_message', (message) => {
      // If this message belongs to the currently open conversation, append it
      if (
        activeConversationRef.current &&
        message.conversation === activeConversationRef.current._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

   socket.on('conversation_updated', (updatedConv) => {
  setConversations((prev) => {
    const exists = prev.find((c) => c._id === updatedConv._id);
    let next;
    if (exists) {
      next = prev.map((c) =>
        c._id === updatedConv._id
          ? {
              ...c,
              ...updatedConv,
              // keep the already-populated user object; don't let a plain ID overwrite it
              user: typeof updatedConv.user === 'object' ? updatedConv.user : c.user,
            }
          : c
      );
    } else {
      next = [updatedConv, ...prev];
    }
    return next.sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
  });
});

    return () => {
      socket.disconnect();
    };
  }, []);

  // ---- Load conversation list ----
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const { data } = await api.get('/chat/conversations');
        setConversations(data);
      } catch (err) {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  // ---- Auto scroll to bottom ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Open a conversation ----
  const openConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);

    // leave previous room, join new one
    if (activeConversationRef.current) {
      socket.emit('leave_conversation', activeConversationRef.current._id);
    }
    socket.emit('join_conversation', conversation._id);

    try {
      const { data } = await api.get(`/chat/${conversation._id}/messages`);
      setMessages(data);
    } catch (err) {
      toast.error('Failed to load messages');
    }

    // mark as read
    socket.emit('mark_as_read', { conversationId: conversation._id, readerRole: 'admin' });
    setConversations((prev) =>
      prev.map((c) => (c._id === conversation._id ? { ...c, unreadByAdmin: 0 } : c))
    );
  }, []);

  // ---- Image selection ----
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Send message (text and/or image) ----
  const handleSend = async () => {
    if (!activeConversation) return;
    if (!text.trim() && !imageFile) return;

    let imageUrl = null;

    try {
      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await api.post('/chat/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = data.url;
      }

      socket.emit(
        'send_message',
        {
          conversationId: activeConversation._id,
          userId: activeConversation.user?._id,
          senderRole: 'admin',
          text: text.trim(),
          image: imageUrl,
        },
        (response) => {
          if (!response?.success) {
            toast.error(response?.error || 'Failed to send message');
          }
        }
      );

      setText('');
      clearImageSelection();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.user?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-black text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ffd500]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-gray-400 mt-8">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-8">No conversations yet</p>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                  activeConversation?._id === conv._id ? 'bg-yellow-50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#111] text-[#ffd500] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(conv.user?.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {conv.user?.name || 'Unknown user'}
                    </p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                    {conv.unreadByAdmin > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        {conv.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-[#f8f8f8]">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#111] text-[#ffd500] flex items-center justify-center font-bold text-sm">
                {(activeConversation.user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{activeConversation.user?.name}</p>
                <p className="text-xs text-gray-400">{activeConversation.user?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin';
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[65%] rounded-2xl px-4 py-2 text-sm ${
                        isAdmin
                          ? 'bg-[#ffd500] text-black rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.productRef?.name && (
                        <div className="flex items-center gap-2 mb-2 bg-black/5 rounded-lg p-2">
                          {msg.productRef.image && (
                            <img
                              src={msg.productRef.image}
                              alt={msg.productRef.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="text-xs font-semibold truncate">{msg.productRef.name}</span>
                        </div>
                      )}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Sent"
                          className="rounded-lg mb-1 max-w-full max-h-64 object-cover cursor-pointer"
                          onClick={() => window.open(msg.image, '_blank')}
                        />
                      )}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      <p
                        className={`text-[10px] mt-1 ${
                          isAdmin ? 'text-black/50' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Image preview before sending */}
            {imagePreview && (
              <div className="px-5 pt-2">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover" />
                  <button
                    onClick={clearImageSelection}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4 flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Attach image"
              >
                <ImageIcon size={20} />
              </button>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ffd500]"
              />
              <button
                onClick={handleSend}
                disabled={uploading || (!text.trim() && !imageFile)}
                className="p-2.5 rounded-lg bg-[#ffd500] text-black hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
