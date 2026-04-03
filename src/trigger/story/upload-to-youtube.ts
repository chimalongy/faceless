import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase";

type UploadToYoutubePayload = {
  storyId: string;
  userId: string;
};

export const uploadStoryToYoutubeTask = task({
  id: "upload-story-to-youtube",

  run: async (payload: UploadToYoutubePayload) => {
    const { storyId, userId } = payload;

    logger.info("🎥 Starting YouTube upload task", { storyId, userId });
    let clientid = "749093252997-f7kroogqmtnab8uvakjhv2900d9hbtd4.apps.googleusercontent.com"
    let clientsecret = "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"


    // 1. Fetch story details
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*, channels(*)")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      logger.error("❌ Story not found", { storyId, error: storyError });
      throw new Error(`Story not found: ${storyId}`);
    }

    logger.info("📽 Tracking story intent for YouTube upload", {
      title: story.title,
      videoUrl: story.completd_video_url || story.public_url,
      channelName: story.channels?.name,
    });

    // 2. Placeholder for YouTube API Upload Logic
    // This is where you would use the YouTube Data API to upload the video.
    // Note: You would need the channel's OAuth tokens.

    // For now, we simulate a successful queueing of the upload.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info("✅ YouTube upload task successfully queued (placeholder)", {
      storyId,
      title: story.title,
    });

    return {
      success: true,
      storyId,
      message: "YouTube upload successfully initiated (placeholder)",
    };
  },
});
