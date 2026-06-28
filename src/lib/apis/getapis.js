import { supabase } from '../supabase';

export async function getImageGenerationUrls(targetkeys) {
    const { data, error } = await supabase
        .from('image_apis')
        .select('id, source, value, usage_count')
        .eq("source", targetkeys); // ✅ use variable


    if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
    }

    return data;
}

export async function getLLMAPIs() {
    const { data, error } = await supabase
        .from('llm_apis')
        .select('*')
    if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
    }

    return data;
}