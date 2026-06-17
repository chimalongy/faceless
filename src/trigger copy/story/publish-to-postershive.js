import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import axios from "axios";

const POSTERSHIVE_PUBLISH_URL = "https://postershive.vercel.app/api/publish";

export const publishToPostersHiveTask = task({
  id: "publish-to-postershive",

  run: async (payload) => {
    const { storyId, scheduled_at } = payload;

    const isScheduled = !!scheduled_at;

    logger.info("Starting PostersHive publishing task", {
      storyId,
      scheduled_at: scheduled_at ?? "(immediate)",
      isScheduled,
    });

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

    // 3. Build PostersHive payload
    const payloadBody = {
      platform: "youtube",
      post_title: story.title,
      description: story.story_description,
      media_url: mediaUrl,
      thumbnail_url: story.thumbnail_url || "",
    };

    // Only include scheduled_at when a future date was provided
    if (isScheduled) {
      payloadBody.scheduled_at = scheduled_at;
    }

    logger.info("Sending publish request to PostersHive", {
      url: POSTERSHIVE_PUBLISH_URL,
      payloadBody,
    });

    const response = await axios.post(POSTERSHIVE_PUBLISH_URL, payloadBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    logger.info("PostersHive response received", {
      status: response.status,
      data: response.data,
    });

    // 4. Update post_status in DB
    //    "scheduled" when a future time was sent, "true" for immediate publish
    const newPostStatus = isScheduled ? "scheduled" : "true";

    const { error: updateError } = await supabase
      .from("stories")
      .update({ post_status: newPostStatus })
      .eq("id", storyId);

    if (updateError) {
      logger.error("Failed to update story post_status", { updateError });
      throw updateError;
    }

    logger.info(`Database post_status updated to "${newPostStatus}"`, {
      storyId,
      isScheduled,
      scheduled_at: scheduled_at ?? null,
    });

    return {
      success: true,
      storyId,
      postStatus: newPostStatus,
      scheduled_at: scheduled_at ?? null,
      data: response.data,
    };
  },
});
