import { supabase } from '../lib/supabase';
import { Scene, TerrainConfig, Block, Wall, Brick, TerrainCell, GridSettings } from '../types/Scene';

const DEFAULT_SCENE_ID = 'default-scene';

export async function getDefaultScene(): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('name', 'default')
    .maybeSingle();

  if (error) {
    console.error('Error fetching default scene:', error);
    return null;
  }

  return data as Scene | null;
}

export async function saveScene(
  terrain: TerrainConfig | null,
  blocks: Block[],
  walls: Wall[],
  bricks: Brick[],
  terrainCells: TerrainCell[],
  gridSettings: GridSettings
): Promise<Scene | null> {
  const existingScene = await getDefaultScene();

  const sceneData = {
    name: 'default',
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
      console.error('Error updating scene:', error);
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
      console.error('Error creating scene:', error);
      return null;
    }

    return data as Scene;
  }
}

export async function deleteScene(): Promise<boolean> {
  const existingScene = await getDefaultScene();

  if (!existingScene) {
    return true;
  }

  const { error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', existingScene.id);

  if (error) {
    console.error('Error deleting scene:', error);
    return false;
  }

  return true;
}

export async function clearSceneData(): Promise<boolean> {
  const existingScene = await getDefaultScene();

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
    console.error('Error clearing scene:', error);
    return false;
  }

  return true;
}
