import { supabase } from '../lib/supabase';

export interface SellerData {
  email: string;
  full_name: string;
  phone?: string;
  commission_rate?: number;
  status?: string;
}

export const sellerService = {
  async getAllSellers() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false});

    if (error) throw error;
    return data || [];
  },

  async updateSeller(id: string, updates: Partial<SellerData>) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sellers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteSeller(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultipleSellers(ids: string[]) {
    if (!supabase) return;

    const { error } = await supabase
      .from('sellers')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async getSellerByEmail(email: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
