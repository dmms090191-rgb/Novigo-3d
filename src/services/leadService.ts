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
    console.log('🚀 [leadService v2.0] Tentative de création de lead:', leadData);
    console.log('🚀 [leadService v2.0] Timestamp:', new Date().toISOString());

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

      console.log('📊 [leadService v2.0] Réponse brute Supabase:', { data, error });

      if (error) {
        console.error('❌ [leadService v2.0] ERREUR DÉTECTÉE');
        console.error('❌ Code:', error.code);
        console.error('❌ Message:', error.message);
        console.error('❌ Détails:', error.details);
        console.error('❌ Hint:', error.hint);
        throw new Error(`Erreur Supabase: ${error.message} (Code: ${error.code})`);
      }

      if (!data) {
        console.error('❌ [leadService v2.0] Aucune donnée retournée');
        throw new Error('Aucune donnée retournée par Supabase');
      }

      console.log('✅ [leadService v2.0] SUCCESS! Lead créé:', data);
      return data;
    } catch (err: any) {
      console.error('❌ [leadService v2.0] Exception capturée:', err);
      console.error('❌ [leadService v2.0] Type:', typeof err);
      console.error('❌ [leadService v2.0] Message:', err.message);
      throw err;
    }
  },

  async getAllLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateLead(id: string, updates: Partial<LeadData>) {
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
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultipleLeads(ids: string[]) {
    console.log('🔧 [deleteMultipleLeads] IDs reçus:', ids);
    const numericIds = ids.map(id => parseInt(id));
    console.log('🔧 [deleteMultipleLeads] IDs numériques:', numericIds);

    const { data, error } = await supabase
      .from('leads')
      .delete()
      .in('id', numericIds)
      .select();

    console.log('🔧 [deleteMultipleLeads] Réponse Supabase:', { data, error });

    if (error) throw error;
    return data;
  },

  async getLeadByEmail(email: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateLeadStatus(id: string, status: string) {
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
