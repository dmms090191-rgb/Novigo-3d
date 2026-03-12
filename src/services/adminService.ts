import { supabase } from '../lib/supabase';

export interface AdminData {
  email: string;
  full_name: string;
  phone?: string;
  role?: string;
  status?: string;
}

export const adminService = {
  async createAdmin(email: string, password: string, adminData: AdminData) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const { data, error } = await supabase
      .from('admins')
      .insert([{
        id: authData.user.id,
        ...adminData
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllAdmins() {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateAdmin(id: string, updates: Partial<AdminData>) {
    const { data, error } = await supabase
      .from('admins')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteAdmin(id: string) {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultipleAdmins(ids: string[]) {
    const { error } = await supabase
      .from('admins')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async getAdminByEmail(email: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
