import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import axios from "axios";

export const publishToPostersHiveTask = task({
  id: "publish-to-postershive",

  run: async (payload) => {
    const { storyId } = payload;

    logger.info("Starting PostersHive publishing task", { storyId });

    // 1. Fetch story and channel details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, channels(*)")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      throw new Error(`Story ${storyId} not found`);
    }

    // 2. Extract configuration
    const channelConfig = JSON.parse(story.channels?.configurations || "{}");
    const apiKey = channelConfig.postershive?.api_key;

    if (!apiKey) {
      throw new Error(`PostersHive API Key is missing for channel ${story.channel_id}`);
    }

    const mediaUrl = story.completd_video_url || story.public_url;
    if (!mediaUrl) {
      throw new Error(`Video URL not found for story ${storyId}`);
    }

    const payloadBody = {
      platform: "youtube",
      post_title: story.title,
      description: story.story_description,
      media_url: mediaUrl,
      thumbnail_url: story.thumbnail_url || "",
    };

    logger.info(payloadBody)
    console.log(payloadBody)

    logger.info("Sending publish request to PostersHive", {
      url: "https://postershive.vercel.app/api/publish",
      payloadBody
    });

    const response = await axios.post("https://postershive.vercel.app/api/publish", payloadBody, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    logger.info("PostersHive response received", {
      status: response.status,
      data: response.data
    });

    // 3. Set post_status = 'true' in DB on success
    const { error: updateError } = await supabase
      .from("stories")
      .update({ post_status: "true" })
      .eq("id", storyId);

    if (updateError) {
      logger.error("Failed to update story post_status", { updateError });
      throw updateError;
    }

    logger.info("Database post_status updated to true");

    return {
      success: true,
      data: response.data,
    };
  },
});
