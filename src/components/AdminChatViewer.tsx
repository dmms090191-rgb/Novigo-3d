import React, { useState, useEffect } from 'react';
import { MessageSquare, User, Eye } from 'lucide-react';

interface Client {
  id: string;
  full_name: string;
  email: string;
  assigned_agent_name: string;
}

interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  sender_type: 'client' | 'seller';
  message: string;
  read: boolean;
  created_at: string;
}

interface AdminChatViewerProps {
  supabaseUrl: string;
  supabaseKey: string;
}

const AdminChatViewer: React.FC<AdminChatViewerProps> = ({
  supabaseUrl,
  supabaseKey,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadMessages(selectedClient.id);
      const interval = setInterval(() => loadMessages(selectedClient.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/clients?select=id,full_name,email,assigned_agent_name&order=created_at.desc`,
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
        setClients(data.filter((c: Client) => c.assigned_agent_name));
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (clientId: string) => {
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
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Aucune conversation
          </h3>
          <p className="text-gray-600">
            Les conversations entre clients et sellers apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Conversations ({clients.length})</h3>
        </div>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedClient?.id === client.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{client.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">Agent: {client.assigned_agent_name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedClient ? (
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedClient.full_name}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Agent: {selectedClient.assigned_agent_name} - Mode lecture seule
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>Aucun message dans cette conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const messageDate = formatDate(msg.created_at);
                  const showDateSeparator = messageDate !== lastDate;
                  lastDate = messageDate;

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
                        className={`flex ${
                          msg.sender_type === 'seller' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                            msg.sender_type === 'seller'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          } rounded-2xl px-4 py-3 shadow-sm`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {msg.sender_type === 'seller'
                              ? selectedClient.assigned_agent_name
                              : selectedClient.full_name}
                          </p>
                          <p className="text-sm break-words">{msg.message}</p>
                          <div className="flex items-center gap-1 justify-end mt-2">
                            <span
                              className={`text-xs ${
                                msg.sender_type === 'seller'
                                  ? 'text-emerald-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Eye className="w-4 h-4" />
                <p>Mode lecture seule - Les admins ne peuvent pas participer aux conversations</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Sélectionnez une conversation pour la visualiser</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatViewer;
