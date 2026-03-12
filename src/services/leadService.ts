import { supabase } from '../lib/supabase';

export interface LeadData {
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  address?: string;
  project_description?: string;
  status?: string;
  assigned_to?: string;
  source?: string;
  notes?: string;
}

export const leadService = {
  async createLead(leadData: LeadData) {
    if (!supabase) return null;

    try {
      const { data: maxIdData } = await supabase
        .from('leads')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newId = maxIdData ? maxIdData.id + 1 : 10000;

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, id: newId }])
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating lead:', err);
      throw err;
    }
  },

  async getAllLeads() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateLead(id: string, updates: Partial<LeadData>) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteLead(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultipleLeads(ids: string[]) {
    if (!supabase) return [];

    const numericIds = ids.map(id => parseInt(id));

    const { data, error } = await supabase
      .from('leads')
      .delete()
      .in('id', numericIds)
      .select();

    if (error) throw error;
    return data;
  },

  async getLeadByEmail(email: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateLeadStatus(id: string, status: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
