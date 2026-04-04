'use server';

import { supabase } from '../lib/supabase';
import { getSessionCookie } from '../lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { videoScript } from '../../samplefiles/sample_script';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from './r2';

// --- Channels ---

export async function createChannel(formData) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  const name = formData.get('name');
  const description = formData.get('description');
  const channel_type = formData.get('channel_type')

  if (!name) throw new Error('Name is required');

  const { error } = await supabase.from('channels').insert({
    user_id: userId,
    name,
    description,
    channel_type,
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

export async function updateChannelConfigurations(channelId, config) {
  const userId = await getSessionCookie();
  if (!userId) throw new Error('Unauthorized');

  if (!channelId || !config) {
    throw new Error('Missing required fields');
  }

  try {
    const { error } = await supabase
      .from('channels')
      .update({ configurations: JSON.stringify(config) })
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
  const content = formData.get('content');
  const social_media_target = formData.get('social_media_target');
  const imageFiles = formData.getAll('images'); // Get multiple files

  if (!title || !topicId || !channelId) throw new Error('Missing required fields');

  // 1. Create Story
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      channel_id: channelId,
      topic_id: topicId,
      title,
      content,
      social_media_target,
    })
    .select()
    .single();

  if (storyError) {
    console.error('Create story error:', storyError);
    throw new Error('Failed to create story');
  }

  // 2. Upload Images (if any)
  if (imageFiles && imageFiles.length > 0) {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file.size === 0) continue;

      const fileExt = file.name.split('.').pop();
      const fileName = `${story.id}/${Date.now()}_${i}.${fileExt}`;

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue with other images even if one fails
        continue;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);

      // Record in story_images table
      await supabase.from('story_images').insert({
        story_id: story.id,
        image_url: publicUrl,
        order_index: i,
        is_ai_generated: false
      });
    }
  }

  revalidatePath(`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`);
  redirect(`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}/stories/${story.id}`);
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
