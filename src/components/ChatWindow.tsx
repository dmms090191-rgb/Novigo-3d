import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  sender_type: 'client' | 'seller';
  message: string;
  read: boolean;
  created_at: string;
}

interface ChatWindowProps {
  clientId: string;
  currentUserId: string;
  currentUserType: 'client' | 'seller';
  senderName: string;
  recipientName: string;
  supabaseUrl: string;
  supabaseKey: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  clientId,
  currentUserId,
  currentUserType,
  senderName,
  recipientName,
  supabaseUrl,
  supabaseKey,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [clientId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/chat_messages?client_id=eq.${clientId}&order=created_at.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        markMessagesAsRead(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (msgs: Message[]) => {
    const unreadMessages = msgs.filter(
      (msg) => !msg.read && msg.sender_id !== currentUserId
    );

    for (const msg of unreadMessages) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/chat_messages?id=eq.${msg.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          client_id: clientId,
          sender_id: currentUserId,
          sender_type: currentUserType,
          message: newMessage.trim(),
          read: false,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
      } else {
        console.error('Error sending message:', await response.text());
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      });
    }
  };

  let lastDate = '';

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-600">
        <h3 className="text-xl font-bold text-white">
          Conversation avec {recipientName}
        </h3>
        <p className="text-emerald-100 text-sm mt-1">
          {currentUserType === 'client' ? 'Votre agent' : 'Client'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>Aucun message pour le moment</p>
            <p className="text-sm mt-2">Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const messageDate = formatDate(msg.created_at);
            const showDateSeparator = messageDate !== lastDate;
            lastDate = messageDate;

            const isOwnMessage = msg.sender_id === currentUserId;

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {messageDate}
                    </div>
                  </div>
                )}
                <div
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } rounded-2xl px-4 py-3 shadow-sm`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {isOwnMessage ? senderName : recipientName}
                    </p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <div className="flex items-center gap-1 justify-end mt-2">
                      <span
                        className={`text-xs ${
                          isOwnMessage ? 'text-emerald-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </span>
                      {isOwnMessage && (
                        <span className="text-emerald-100">
                          {msg.read ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <Send className="w-5 h-5" />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
