import { supabase } from '../supabase';

export async function getImageGenerationUrls(targetkeys) {
  const { data, error } = await supabase
    .from('image_apis')
    .select('id, source, value')
    .eq("source", targetkeys); // ✅ use variable


  if (error) {
    console.error('Error fetching API keys:', error);
    throw error;
  }

  return data;
}