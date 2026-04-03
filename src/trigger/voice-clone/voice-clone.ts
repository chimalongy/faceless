import { task, logger } from "@trigger.dev/sdk/v3";
import axios from "axios";
import { supabase } from "../../lib/supabase";

type VoiceClonePayload = {
  userId: string;
  voiceId: string;
  audioUrl: string;
};

export const voiceCloneTask = task({
  id: "voice-clone-task",

  run: async (payload: VoiceClonePayload) => {
    const { userId, voiceId, audioUrl } = payload;

    logger.info("🎤 Voice clone task started", payload);

    const url ="https://me-chimaobi--pocket-tts-service-voicetts-clone.modal.run"
     

    try {
      const response = await axios.post(url, {
        voice_id: voiceId,
        url: audioUrl,
      });

      logger.info("✅ Modal response", response.data);

      if (response.data?.success) {
        await supabase
          .from("voice_clones")
          .update({
            clone_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("voice_id", voiceId);

        logger.info("🧠 Supabase updated → completed", { voiceId });

        return {
          success: true,
          voiceId,
        };
      }

      throw new Error(response.data?.message || "Voice cloning failed");
    } catch (error: any) {
      logger.error("❌ Voice cloning failed", {
        error: error?.response?.data || error.message,
      });

      await supabase
        .from("voice_clones")
        .update({
          clone_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("voice_id", voiceId);

      throw error;
    }
  },
});
