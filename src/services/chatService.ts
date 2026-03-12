import { supabase } from '../lib/supabase';

export interface ChatMessageData {
  client_id: string;
  sender_id: string;
  sender_type: 'client' | 'seller';
  message: string;
  read?: boolean;
}

export const chatService = {
  async sendMessage(messageData: ChatMessageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getMessagesForClient(clientId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('id', messageId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUnreadCount(clientId: string, userType: 'client' | 'seller') {
    const senderType = userType === 'client' ? 'seller' : 'client';

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('sender_type', senderType)
      .eq('read', false);

    if (error) throw error;
    return data || 0;
  },

  subscribeToMessages(clientId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${clientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `client_id=eq.${clientId}`
        },
        callback
      )
      .subscribe();
  }
};
