import { supabase } from '../lib/supabase';
import { Status } from '../types/Status';

export const statusService = {
  async getAllStatuses(): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching statuses:', error);
      throw error;
    }

    return data || [];
  },

  async createStatus(name: string, color: string): Promise<Status> {
    const { data, error } = await supabase
      .from('statuses')
      .insert([{ name, color }])
      .select()
      .single();

    if (error) {
      console.error('Error creating status:', error);
      throw error;
    }

    return data;
  },

  async deleteStatus(id: string): Promise<void> {
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  },

  async updateStatus(id: string, name: string, color: string): Promise<Status> {
    const { data, error } = await supabase
      .from('statuses')
      .update({ name, color })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating status:', error);
      throw error;
    }

    return data;
  }
};
