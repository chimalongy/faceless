import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { getSessionCookie } from '../../../../../../../../lib/auth';
import { supabase } from '../../../../../../../../lib/supabase';
import EditTopicConfigForm from '../../../../../../../../components/topics/EditTopicConfigForm';

export default async function TopicConfigurePage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { channelId, topicId } = await params;

  // Fetch topic configuration fields
  const { data: topic, error } = await supabase
    .from('topics')
    .select('id, name, description, image_generation_theme, story_thumbnail_prompt, thumbnail_font, thumbnail_text_size, thumbnail_text_align, thumbnail_text_position, channel_id')
    .eq('id', topicId)
    .eq('user_id', userId)
    .single();

  if (error || !topic) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-10 px-2">
      {/* ── BACK LINK ── */}
      <Link
        href={`/dashboard/channels/${channelId}/v1/topics/${topicId}`}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-stone-400 hover:text-orange-500 transition-colors no-underline group"
      >
        <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-all">
          <FaArrowLeft className="text-[10px]" />
        </span>
        Back to Topic
      </Link>

      {/* ── PAGE HEADER ── */}
      <div>
        <p className="text-[12px] font-bold tracking-[0.12em] text-orange-500 uppercase mb-1.5">
          Topic · {topic.name}
        </p>
        <h1
          className="text-[28px] font-extrabold text-stone-900 tracking-tight leading-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Topic Settings
        </h1>
        <p className="text-[15px] text-stone-400 mt-1 max-w-lg">
          Configure prompt settings and thumbnail fonts for all stories generated under this topic.
        </p>
      </div>

      {/* ── CONFIGURATION FORM ── */}
      <EditTopicConfigForm topic={topic} channelId={channelId} />
    </div>
  );
}
