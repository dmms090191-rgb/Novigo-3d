import React, { useState, useEffect } from 'react';
import { MessageSquare, User } from 'lucide-react';
import ChatWindow from './ChatWindow';

interface Client {
  id: string;
  full_name: string;
  email: string;
  assigned_agent_name: string;
}

interface SellerChatListProps {
  sellerId: string;
  sellerFullName: string;
  supabaseUrl: string;
  supabaseKey: string;
}

const SellerChatList: React.FC<SellerChatListProps> = ({
  sellerId,
  sellerFullName,
  supabaseUrl,
  supabaseKey,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/clients?assigned_agent_name=eq.${encodeURIComponent(sellerFullName)}&select=id,full_name,email,assigned_agent_name`,
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
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Aucun client assigné
          </h3>
          <p className="text-gray-600">
            Les clients qui vous sont assignés apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Clients ({clients.length})</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedClient?.id === client.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{client.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{client.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedClient ? (
          <ChatWindow
            clientId={selectedClient.id}
            currentUserId={sellerId}
            currentUserType="seller"
            senderName={sellerFullName}
            recipientName={selectedClient.full_name}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Sélectionnez un client pour démarrer la conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerChatList;
