import { supabase } from '../lib/supabase';
import { LibraryElement, DrawingData, PlacementParams } from '../types/ElementLibrary';

export const elementLibraryService = {
  async getAll(): Promise<LibraryElement[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('elements_library')
        .select('id, name, category, icon, width, height, depth, drawing_data, preview_image, placement_params, created_at, updated_at')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching elements:', error.message, error.details);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('Exception fetching elements:', e);
      return [];
    }
  },

  async getByCategory(category: string): Promise<LibraryElement[]> {
    const { data, error } = await supabase
      .from('elements_library')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching elements by category:', error);
      return [];
    }

    return data || [];
  },

  async getById(id: string): Promise<LibraryElement | null> {
    const { data, error } = await supabase
      .from('elements_library')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching element:', error);
      return null;
    }

    return data;
  },

  async create(element: {
    name: string;
    category: string;
    icon?: string;
    width?: number;
    height?: number;
    depth?: number;
    placement_params?: PlacementParams;
  }): Promise<LibraryElement | null> {
    const { data, error } = await supabase
      .from('elements_library')
      .insert({
        name: element.name,
        category: element.category,
        icon: element.icon || 'box',
        width: element.width || 100,
        height: element.height || 100,
        depth: element.depth || 100,
        placement_params: element.placement_params || {
          snapToGrid: true,
          rotatable: true,
          scalable: true,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating element:', error);
      return null;
    }

    return data;
  },

  async update(
    id: string,
    updates: Partial<{
      name: string;
      category: string;
      icon: string;
      width: number;
      height: number;
      depth: number;
      placement_params: PlacementParams;
    }>
  ): Promise<LibraryElement | null> {
    const { data, error } = await supabase
      .from('elements_library')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating element:', error);
      return null;
    }

    return data;
  },

  async saveDrawing(
    id: string,
    drawingData: DrawingData,
    previewImage: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('elements_library')
      .update({
        drawing_data: drawingData,
        preview_image: previewImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error saving drawing:', error);
      return false;
    }

    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('elements_library')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting element:', error);
      return false;
    }

    return true;
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('elements_library')
      .select('category')
      .order('category');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = [...new Set(data?.map((d) => d.category) || [])];
    return categories;
  },
};
