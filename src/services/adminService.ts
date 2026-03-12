import { supabase } from '../lib/supabase';

export interface AdminData {
  email: string;
  first_name: string;
  last_name: string;
  password_pin: string;
  phone?: string;
  role?: string;
  status?: string;
}

export const adminService = {
  async createAdmin(adminData: AdminData) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('admins')
      .insert([{
        id: crypto.randomUUID(),
        email: adminData.email,
        full_name: `${adminData.first_name} ${adminData.last_name}`,
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        password_pin: adminData.password_pin,
        role: adminData.role || 'admin',
        status: adminData.status || 'active'
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllAdmins() {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateAdmin(id: string, updates: Partial<AdminData>) {
    if (!supabase) return null;

    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.first_name || updates.last_name) {
      const currentAdmin = await this.getAdminById(id);
      if (currentAdmin) {
        updateData.full_name = `${updates.first_name || currentAdmin.first_name} ${updates.last_name || currentAdmin.last_name}`;
      }
    }

    const { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updatePasswordPin(id: string, pin: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('admins')
      .update({ password_pin: pin, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAdminById(id: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteAdmin(id: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMultipleAdmins(ids: string[]) {
    if (!supabase) return;

    const { error } = await supabase
      .from('admins')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  async getAdminByEmail(email: string) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async verifyAdminLogin(email: string, password: string): Promise<{ success: boolean; admin?: any }> {
    if (!supabase) return { success: false };

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('password_pin', password)
      .maybeSingle();

    if (error) {
      console.error('Erreur vérification login admin:', error);
      return { success: false };
    }

    if (data) {
      return { success: true, admin: data };
    }

    return { success: false };
  }
};
