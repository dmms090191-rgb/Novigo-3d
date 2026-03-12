import { supabase } from '../lib/supabase';
import { Scene, TerrainConfig, Block, Wall, Brick, TerrainCell, GridSettings } from '../types/Scene';

export async function getDefaultDrawing(): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('name', 'interactive-drawing')
    .maybeSingle();

  if (error) {
    console.error('Error fetching default drawing:', error);
    return null;
  }

  return data as Scene | null;
}

export async function saveDrawing(
  terrain: TerrainConfig | null,
  blocks: Block[],
  walls: Wall[],
  bricks: Brick[],
  terrainCells: TerrainCell[],
  gridSettings: GridSettings
): Promise<Scene | null> {
  const existingScene = await getDefaultDrawing();

  const sceneData = {
    name: 'interactive-drawing',
    terrain: terrain,
    blocks: blocks,
    walls: walls,
    bricks: bricks,
    terrain_cells: terrainCells,
    grid_settings: gridSettings,
    updated_at: new Date().toISOString()
  };

  if (existingScene) {
    const { data, error } = await supabase
      .from('scenes')
      .update(sceneData)
      .eq('id', existingScene.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating drawing:', error);
      return null;
    }

    return data as Scene;
  } else {
    const { data, error } = await supabase
      .from('scenes')
      .insert(sceneData)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating drawing:', error);
      return null;
    }

    return data as Scene;
  }
}

export async function clearDrawingData(): Promise<boolean> {
  const existingScene = await getDefaultDrawing();

  if (!existingScene) {
    return true;
  }

  const { error } = await supabase
    .from('scenes')
    .update({
      terrain: null,
      blocks: [],
      walls: [],
      bricks: [],
      terrain_cells: [],
      grid_settings: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingScene.id);

  if (error) {
    console.error('Error clearing drawing:', error);
    return false;
  }

  return true;
}
