import { supabase } from '../lib/supabase';

export interface ClientData {
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  address?: string;
  project_description?: string;
  status?: string;
  assigned_agent_name?: string;
}

export const clientService = {
  async getAllClients() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        status:statuses(id, name, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getClientById(id: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getClientByEmail(email: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createClient(clientData: ClientData) {
    if (!supabase) return null;

    const { data: maxIdData } = await supabase
      .from('clients')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newId = maxIdData ? maxIdData.id + 1 : 10000;

    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, id: newId }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateClient(id: string, updates: Partial<ClientData>) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteClient(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateClientStatus(id: string, statusId: string | null) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clients')
      .update({ status_id: statusId })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
