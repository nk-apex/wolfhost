import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Community = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const token = localStorage.getItem('jwt_token');

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  };

  const fetchMessages = async (initial = false) => {
    try {
      const res = await fetch('/api/community/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setOnlineCount(data.onlineCount || 0);
        if (initial) {
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    pollIntervalRef.current = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(pollIntervalRef.current);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        await fetchMessages();
        scrollToBottom();
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      const res = await fetch(`/api/community/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
      }
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getAvatarColor = (username) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 45%)`;
  };

  const isOwnMessage = (msg) => {
    return msg.userId === user?.panelId || msg.username === user?.username;
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
              Community
            </h1>
            <p className="text-sm font-mono text-gray-500 mt-1">
              Public chat — everyone can see messages
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/10 bg-black/50">
            <Users size={14} className="text-primary/70" />
            <span className="text-xs font-mono text-primary/70">
              {onlineCount} online
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-primary/10 bg-black/40 backdrop-blur-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="px-4 py-3 border-b border-primary/10 bg-black/30 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary/60" />
            <span className="text-sm font-mono text-gray-400">
              General Chat
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-yellow-500/60" />
              <span className="text-xs font-mono text-gray-600">
                Be respectful — all messages are public
              </span>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-mono text-gray-500">
                    Loading messages...
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare
                    size={48}
                    className="text-primary/10 mx-auto mb-3"
                  />
                  <p className="text-sm font-mono text-gray-500">
                    No messages yet — be the first to say something!
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group flex gap-3 ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10"
                      style={{ backgroundColor: getAvatarColor(msg.username) }}
                    >
                      {msg.username.charAt(0).toUpperCase()}
                    </div>

                    <div className={`max-w-[75%] ${isOwnMessage(msg) ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage(msg) && (
                          <span className="text-xs font-mono font-semibold text-primary/80">
                            {msg.username}
                          </span>
                        )}
                        {isOwnMessage(msg) && (
                          <span className="text-xs font-mono font-semibold text-primary/80">
                            You
                          </span>
                        )}
                        {msg.isAdmin && (
                          <span className="flex items-center gap-0.5 text-[10px] font-mono bg-primary/10 text-primary/70 px-1.5 py-0.5 rounded-full border border-primary/20">
                            <Shield size={8} />
                            ADMIN
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                          <Clock size={9} />
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`px-3 py-2 rounded-lg text-sm font-mono leading-relaxed ${
                          isOwnMessage(msg)
                            ? 'bg-primary/10 border border-primary/20 text-gray-200'
                            : 'bg-white/[0.03] border border-primary/5 text-gray-300'
                        }`}
                      >
                        {msg.message}
                      </div>

                      {(isOwnMessage(msg) || user?.isAdmin) && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-mono text-red-500/50 hover:text-red-500"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 border-t border-primary/10 bg-black/30"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1 bg-black/50 border border-primary/10 rounded-lg px-4 py-2.5 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary/30 transition-colors"
              />
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={14} />
                Send
              </motion.button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[10px] font-mono text-gray-600">
                {newMessage.length}/500
              </span>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Community;
