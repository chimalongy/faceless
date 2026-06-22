'use server';

import { supabase } from '../lib/supabase';
import { getSessionCookie } from '../lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { videoScript } from '../../samplefiles/sample_script';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from './r2';
import { tasks } from "@trigger.dev/sdk/v3";
import { configureTrigger } from "./triggerConfig";

// --- Channels ---

export async function createChannel(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const name = formData.get('name');
  const description = formData.get('description');
  const channel_type = formData.get('channel_type');
  const content_theme = formData.get('content_theme');
  const narrator_voice = formData.get('narrator_voice'); // ← add this

  if (!name) throw new Error('Name is required');

  const { error } = await supabase.from('channels').insert({
    user_id: userId,
    name,
    description,
    channel_type,
    content_theme,
    narrator_voice, // ← add this
  });

  if (error) {
    console.error('Create channel error:', error);
    throw new Error('Failed to create channel');
  }

  revalidatePath('/dashboard/channels');
  redirect('/dashboard/channels');
}

export async function getChannels() {
  const userId = await getSessionCookie();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('channels')
    .select('*, topics(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get channels error:', error);
    return [];
  }

  return data;
}

export async function getChannel(channelId) {
  const userId = await getSessionCookie();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();

  if (error) {
    console.error('Get channel error:', error);
    return null;
  }

  return data;
}

export async function deleteChannel(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');

  if (!channelId) throw new Error('Channel ID is required');

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', channelId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete channel error:', error);
    throw new Error('Failed to delete channel');
  }

  revalidatePath('/dashboard/channels');
  redirect('/dashboard/channels');
}

export async function updateChannelMedia(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');
  const type = formData.get('type'); // 'picture' or 'banner'
  const file = formData.get('file');

  if (!channelId || !type || !file) {
    throw new Error('Missing required fields');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `channels/${channelId}/${type}_${Date.now()}.${fileExt}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // Update Supabase
    const updateData = type === 'picture'
      ? { channel_picture_url: publicUrl }
      : { channel_banner_url: publicUrl };

    const { error } = await supabase
      .from('channels')
      .update(updateData)
      .eq('id', channelId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/dashboard/channels/${channelId}/v1`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Update channel media error:', error);
    throw new Error('Failed to update channel media');
  }
}

export async function updateChannelConfigurations(channelId, config, contentTheme, narratorVoice) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  if (!channelId || !config) {
    throw new Error('Missing required fields');
  }

  try {
    const { error } = await supabase
      .from('channels')
      .update({ 
        configurations: JSON.stringify(config),
        content_theme: contentTheme,
        narrator_voice: narratorVoice,
      })
      .eq('id', channelId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/dashboard/channels/${channelId}/v1/configure`);
    revalidatePath(`/dashboard/channels/${channelId}/v1`);
    return { success: true };
  } catch (error) {
    console.error('Update channel configurations error:', error);
    throw new Error('Failed to update channel configurations');
  }
}

export async function updateStoryThumbnail(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');
  const topicId = formData.get('topicId');
  const storyId = formData.get('storyId');
  const file = formData.get('file');

  if (!storyId || !file) {
    throw new Error('Missing required fields');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `channels/${channelId}/topics/${topicId}/stories/${storyId}/thumbnail_${Date.now()}.${fileExt}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // Update Supabase
    const { error } = await supabase
      .from('stories')
      .update({ thumbnail_url: publicUrl })
      .eq('id', storyId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/stories/${storyId}`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Update story thumbnail error:', error);
    throw new Error('Failed to update story thumbnail');
  }
}

export async function deleteStoryThumbnail(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');
  const topicId = formData.get('topicId');
  const storyId = formData.get('storyId');

  if (!storyId) throw new Error('Story ID is required');

  try {
    const { error } = await supabase
      .from('stories')
      .update({ thumbnail_url: null })
      .eq('id', storyId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/stories/${storyId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete story thumbnail error:', error);
    throw new Error('Failed to delete story thumbnail');
  }
}

// --- Topics ---

export async function createTopic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');
  const name = formData.get('name');
  const description = formData.get('description');
  const background_music_prompt = formData.get('background_music_prompt') || null;
  const image_generation_theme = formData.get('image_generation_theme') || null;

  if (!name || !channelId) throw new Error('Missing required fields');

  const { error } = await supabase.from('topics').insert({
    user_id: userId,
    channel_id: channelId,
    name,
    description,
    background_music_prompt,
    image_generation_theme,
  });

  if (error) {
    console.error('Create topic error:', error);
    throw new Error('Failed to create topic');
  }

  revalidatePath(`/dashboard/channels/${channelId}`);
  redirect(`/dashboard/channels/${channelId}`);
}

export async function getTopic(topicId) {
  const userId = await getSessionCookie();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();

  if (error) return null;
  return data;
}

export async function updateMusicPrompt(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');
  const background_music_prompt = formData.get('background_music_prompt') || null;
  const rawDuration = formData.get('background_music_duration');
  const background_music_duration = rawDuration ? parseInt(rawDuration) : null;

  if (!topicId) throw new Error('Topic ID is required');

  const { error } = await supabase
    .from('topics')
    .update({ background_music_prompt, background_music_duration })
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update music prompt error:', error);
    throw new Error('Failed to update music prompt');
  }

  revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`);
}

export async function updateMusicVolume(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');
  const rawVolume = formData.get('background_music_volume');

  if (!topicId) throw new Error('Topic ID is required');

  const background_music_volume = rawVolume !== null ? parseFloat(rawVolume) : 0.2;

  if (isNaN(background_music_volume) || background_music_volume < 0 || background_music_volume > 1) {
    throw new Error('Volume must be between 0 and 1');
  }

  const { error } = await supabase
    .from('topics')
    .update({ background_music_volume })
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update music volume error:', error);
    throw new Error('Failed to update music volume');
  }

  revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`);
}

export async function updateTopicConfig(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');
  const image_generation_theme = formData.get('image_generation_theme') || null;
  const story_thumbnail_prompt = formData.get('story_thumbnail_prompt') || null;
  const thumbnail_font = formData.get('thumbnail_font') || 'Inter-Bold.ttf';

  if (!topicId) throw new Error('Topic ID is required');

  const { error } = await supabase
    .from('topics')
    .update({ 
      image_generation_theme, 
      story_thumbnail_prompt, 
      thumbnail_font 
    })
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update topic config error:', error);
    throw new Error('Failed to update topic config');
  }

  revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}`);
  return { success: true };
}

export async function deleteTopic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');
  const channel_type = formData.get('channel_type');

  if (!topicId || !channelId) {
    throw new Error('Missing required fields');
  }

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete topic error:', error);
    throw new Error('Failed to delete topic');
  }

  revalidatePath(`/dashboard/channels/${channelId}/${channel_type}`);
  redirect(`/dashboard/channels/${channelId}/${channel_type}`);
}

// --- Stories ---

export async function createStory(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const channelId = formData.get('channelId');
  const topicId = formData.get('topicId');
  const channel_type = formData.get('channel_type') || 'v1'; // Defaulting to v1 if missing to prevent redirect errors
  const title = formData.get('title');
  const description = formData.get('description');

  if (!title || !topicId || !channelId) throw new Error('Missing required fields');

  // Fetch topic details
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('name, description')
    .eq('id', topicId)
    .single();

  if (topicError || !topic) {
    console.error('Fetch topic error:', topicError);
    throw new Error('Failed to find topic details');
  }

  // Trigger the background task
  await configureTrigger();
  await tasks.trigger("generate-stories", {
    userId,
    topicId,
    channelId,
    topicName: topic.name,
    topicDescription: topic.description,
    storyCount: 1,
    storyTitle: title,
    storyPromptDescription: description,
  });

  revalidatePath(`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`);
  redirect(`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`);
}

export async function getStory(storyId) {
  const userId = await getSessionCookie();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('stories')
    .select('*, story_images(*)')
    .eq('id', storyId)
    .single();

  if (error) return null;
  return data;
}

export async function generateScript(storyId) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  // Mock Generation Logic
  const mockScript = JSON.stringify(videoScript);

  const { error } = await supabase
    .from('stories')
    .update({
      script_generated: true,
      generated_script: mockScript
    })
    .eq('id', storyId);

  if (error) {
    console.error('Generate script error:', error);
    throw new Error('Failed to generate script');
  }

  revalidatePath(`/dashboard/channels`); // Revalidate liberally for now
}

export async function updateStory(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const storyId = formData.get('storyId');
  const channel_type = formData.get('channel_type');
  const title = formData.get('title');
  const content = formData.get('content');

  if (!storyId || !title) {
    throw new Error('Missing required fields');
  }

  const { error } = await supabase
    .from('stories')
    .update({
      title,
      content,
    })
    .eq('id', storyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update story error:', error);
    throw new Error('Failed to update story');
  }

  const story = await getStory(storyId);

  if (story) {
    revalidatePath(
      `/dashboard/channels/${story.channel_id}/${channel_type}/topics/${story.topic_id}/stories/${story.id}`
    );
    redirect(
      `/dashboard/channels/${story.channel_id}/${channel_type}/topics/${story.topic_id}/stories/${story.id}`
    );
  }
}

export async function updateGeneratedScript(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const storyId = formData.get('storyId');
  const script = formData.get('generated_script');

  if (!storyId) {
    throw new Error('Missing story id');
  }

  const { error } = await supabase
    .from('stories')
    .update({
      generated_script: script,
      script_generated: !!script,
    })
    .eq('id', storyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update generated script error:', error);
    throw new Error('Failed to update generated script');
  }

  const story = await getStory(storyId);

  if (story) {
    revalidatePath(
      `/dashboard/channels/${story.channel_id}/topics/${story.topic_id}/stories/${story.id}`
    );
    redirect(
      `/dashboard/channels/${story.channel_id}/topics/${story.topic_id}/stories/${story.id}`
    );
  }
}

export async function deleteStory(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const storyId = formData.get('storyId');
  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');

  if (!storyId || !topicId || !channelId) {
    throw new Error('Missing required fields');
  }

  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete story error:', error);
    throw new Error('Failed to delete story');
  }

  revalidatePath(`/dashboard/channels/${channelId}/topics/${topicId}`);
  redirect(`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`);
}

// --- Voice Clones ---

export async function getVoiceClones() {
  const userId = await getSessionCookie();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get voice clones error:', error);
    return [];
  }

  return data;
}

export async function createVoiceClone(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const voiceId = formData.get('voice_id');

  if (!voiceId) throw new Error('Voice ID is required');

  const { error } = await supabase.from('voice_clones').insert({
    user_id: userId,
    voice_id: voiceId,
  });

  if (error) {
    console.error('Create voice clone error:', error);
    throw new Error('Failed to create voice clone');
  }

  revalidatePath('/dashboard/voicecloner');
  redirect('/dashboard/voicecloner');
}

export async function deleteVoiceClone(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const cloneId = formData.get('cloneId');

  if (!cloneId) throw new Error('Clone ID is required');

  const { error } = await supabase
    .from('voice_clones')
    .delete()
    .eq('id', cloneId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete voice clone error:', error);
    throw new Error('Failed to delete voice clone');
  }

  revalidatePath('/dashboard/voicecloner');
}

// --- Background Music (Topic Level) ---

export async function getTopicBackgroundMusic(topicId) {
  const userId = await getSessionCookie();
  if (!userId) return [];

  // Verify topic belongs to user
  const { data: topic } = await supabase
    .from('topics')
    .select('id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (!topic) return [];

  const { data, error } = await supabase
    .from('topic_background_music')
    .select('*')
    .eq('topic_id', topicId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get background music error:', error);
    return [];
  }

  return data || [];
}

export async function replaceTopicBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');
  const file = formData.get('file');

  if (!topicId || !file) {
    throw new Error('Missing required fields');
  }

  // Verify topic belongs to user
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (topicError || !topic) {
    throw new Error('Topic not found');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `background-music/topics/${topicId}/uploaded_${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    // Update Supabase
    const { error } = await supabase
      .from('topics')
      .update({ background_music_url: publicUrl })
      .eq('id', topicId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Replace topic background music error:', error);
    throw new Error('Failed to upload and replace background music');
  }
}

export async function clearTopicBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const channelId = formData.get('channelId');

  if (!topicId) throw new Error('Topic ID is required');

  const { error } = await supabase
    .from('topics')
    .update({ background_music_url: null })
    .eq('id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Clear topic background music error:', error);
    throw new Error('Failed to clear background music');
  }

  revalidatePath(`/dashboard/channels/${channelId}/v1/topics/${topicId}/background-music`);
  return { success: true };
}

export async function uploadBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const topicId = formData.get('topicId');
  const musicFile = formData.get('music');
  const volumeLevel = formData.get('volumeLevel') || '0.5';

  if (!topicId || !musicFile) {
    throw new Error('Topic ID and music file are required');
  }

  // Verify topic belongs to user and get channel info
  const { data: topic } = await supabase
    .from('topics')
    .select('id, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Upload music file to Supabase Storage
  const fileExt = musicFile.name.split('.').pop();
  const fileName = `background-music/topics/${topicId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const arrayBuffer = await musicFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, buffer, {
      contentType: musicFile.type || 'audio/mpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('Music upload error:', uploadError);
    throw new Error('Failed to upload music file');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  // Save record to database
  const { error: dbError } = await supabase
    .from('topic_background_music')
    .insert({
      user_id: userId,
      topic_id: topicId,
      music_url: publicUrl,
      music_format: fileExt,
      volume_level: parseFloat(volumeLevel),
    });

  if (dbError) {
    console.error('Database insert error:', dbError);
    throw new Error('Failed to save music record');
  }

  revalidatePath(`/dashboard/channels/${topic.channel_id}/v1/topics/${topicId}/background-music`);
  redirect(`/dashboard/channels/${topic.channel_id}/v1/topics/${topicId}/background-music`);
}

export async function deleteBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const musicId = formData.get('musicId');
  const topicId = formData.get('topicId');

  if (!musicId || !topicId) {
    throw new Error('Music ID and Topic ID are required');
  }

  // Verify topic belongs to user
  const { data: topic } = await supabase
    .from('topics')
    .select('id, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (!topic) {
    throw new Error('Topic not found');
  }

  // Get music record to get storage path
  const { data: music } = await supabase
    .from('topic_background_music')
    .select('music_url')
    .eq('id', musicId)
    .eq('topic_id', topicId)
    .eq('user_id', userId)
    .single();

  if (music && music.music_url) {
    // Extract path from URL and delete from storage
    try {
      const urlParts = music.music_url.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        const bucketName = pathParts[0];
        const filePath = pathParts.slice(1).join('/');

        await supabase.storage
          .from(bucketName)
          .remove([filePath]);
      }
    } catch (err) {
      console.error('Storage delete error:', err);
      // Continue with DB deletion even if storage delete fails
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('topic_background_music')
    .delete()
    .eq('id', musicId)
    .eq('topic_id', topicId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete background music error:', error);
    throw new Error('Failed to delete background music');
  }

  revalidatePath(`/dashboard/channels/${topic.channel_id}/v1/topics/${topicId}/background-music`);
}

// --- Background Music (Story Level) ---

export async function getStoryBackgroundMusic(storyId) {
  const userId = await getSessionCookie();
  if (!userId) return [];

  // Verify story belongs to user
  const { data: story } = await supabase
    .from('stories')
    .select('id')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (!story) return [];

  const { data, error } = await supabase
    .from('story_background_music')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get story background music error:', error);
    return [];
  }

  return data || [];
}

export async function uploadStoryBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const storyId = formData.get('storyId');
  const musicFile = formData.get('music');
  const volumeLevel = formData.get('volumeLevel') || '0.5';
  const sceneNumber = formData.get('sceneNumber');
  const isLooping = formData.get('isLooping') === 'true';

  if (!storyId || !musicFile) {
    throw new Error('Story ID and music file are required');
  }

  // Verify story belongs to user and get topic/channel info
  const { data: story } = await supabase
    .from('stories')
    .select('id, topic_id, channel_id')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (!story) {
    throw new Error('Story not found');
  }

  // Upload music file to Supabase Storage
  const fileExt = musicFile.name.split('.').pop();
  const fileName = `background-music/stories/${storyId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const arrayBuffer = await musicFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(fileName, buffer, {
      contentType: musicFile.type || 'audio/mpeg',
      upsert: false,
    });

  if (uploadError) {
    console.error('Music upload error:', uploadError);
    throw new Error('Failed to upload music file');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  // Save record to database
  const { error: dbError } = await supabase
    .from('story_background_music')
    .insert({
      user_id: userId,
      story_id: storyId,
      music_url: publicUrl,
      music_format: fileExt,
      volume_level: parseFloat(volumeLevel),
      scene_number: sceneNumber ? parseInt(sceneNumber) : null,
      is_looping: isLooping,
    });

  if (dbError) {
    console.error('Database insert error:', dbError);
    throw new Error('Failed to save music record');
  }

  revalidatePath(`/dashboard/channels/${story.channel_id}/v1/topics/${story.topic_id}/stories/${storyId}/background-music`);
  redirect(`/dashboard/channels/${story.channel_id}/v1/topics/${story.topic_id}/stories/${storyId}/background-music`);
}

export async function deleteStoryBackgroundMusic(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const musicId = formData.get('musicId');
  const storyId = formData.get('storyId');

  if (!musicId || !storyId) {
    throw new Error('Music ID and Story ID are required');
  }

  // Verify story belongs to user
  const { data: story } = await supabase
    .from('stories')
    .select('id, topic_id, channel_id')
    .eq('id', storyId)
    .eq('user_id', userId)
    .single();

  if (!story) {
    throw new Error('Story not found');
  }

  // Get music record to get storage path
  const { data: music } = await supabase
    .from('story_background_music')
    .select('music_url')
    .eq('id', musicId)
    .eq('story_id', storyId)
    .single();

  if (music && music.music_url) {
    // Extract path from URL and delete from storage
    try {
      const urlParts = music.music_url.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        const bucketName = pathParts[0];
        const filePath = pathParts.slice(1).join('/');

        await supabase.storage
          .from(bucketName)
          .remove([filePath]);
      }
    } catch (err) {
      console.error('Storage delete error:', err);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('story_background_music')
    .delete()
    .eq('id', musicId)
    .eq('story_id', storyId);

  if (error) {
    console.error('Delete background music error:', error);
    throw new Error('Failed to delete background music');
  }

  revalidatePath(`/dashboard/channels/${story.channel_id}/v1/topics/${story.topic_id}/stories/${storyId}/background-music`);
}

export async function testPostersHiveConnection(apiKey) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    const response = await fetch('https://postershive.vercel.app/api/test-connection', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const result = await response.json();
    console.log('PostersHive test result:', result);

    if (response.status === 200 && result.connected) {
      const platforms = result.account?.connectedPlatforms || [];
      const hasYoutube = platforms.some(p => p.toLowerCase() === 'youtube');

      if (!hasYoutube) {
        return {
          success: false,
          error: 'Connection was successful, but you must connect your YouTube channel in PostersHive first.'
        };
      }

      return { success: true, message: result.message || 'Connection successful!' };
    } else {
      return {
        success: false,
        error: result.error || `Unauthorized: Invalid API Key (Status ${response.status})`
      };
    }
  } catch (err) {
    console.error('PostersHive test connection error:', err);
    return { success: false, error: 'Could not connect to PostersHive server. Please check your network and API key.' };
  }
}

// --- User Settings ---

export async function getUserSettings() {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, use_groq')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Get user settings error:', error);
    throw new Error('Failed to retrieve user settings');
  }

  return data;
}

export async function updateUserSettings(useGroq) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('users')
    .update({ use_groq: useGroq })
    .eq('id', userId);

  if (error) {
    console.error('Update user settings error:', error);
    throw new Error('Failed to update user settings');
  }

  revalidatePath('/dashboard/my-account/settings');
  return { success: true };
}
