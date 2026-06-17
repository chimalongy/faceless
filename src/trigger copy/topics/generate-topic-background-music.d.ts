import { Task } from "@trigger.dev/sdk/v3";

export type GenerateTopicBackgroundMusicPayload = {
  topic_id: string;
  music_prompt: string;
  music_length: number;
};

export declare const GenerateTopicBackgroundMusic: Task<
  "generate-topic-background-music",
  GenerateTopicBackgroundMusicPayload
>;
