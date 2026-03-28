import { supabase } from '../../../../../../../../../../lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { updateStory,getChannel } from '../../../../../../../../../../lib/actions';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default async function EditStoryPage({ params }) {
  const { channelId, topicId, storyId } = await params;
  const [channel] = await Promise.all([
    getChannel(channelId),
  
  ]);

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (!story) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/dashboard/channels/${channelId}/${channel.channel_type}/topics/${topicId}/stories/${storyId}`}
        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6"
      >
        <FaArrowLeft /> Back to Story
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
          Edit Story
        </h1>
        <p className="text-gray-500 mt-1">
          Update the title or content for this story.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-xl border border-orange-100 shadow-sm">
        <form action={updateStory} className="space-y-6">
          <input type="hidden" name="storyId" value={storyId} />

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Story Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={story.title}
              required
              className="input-field"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-gray-700"
            >
              Story Content / Notes
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              defaultValue={story.content || ''}
              className="input-field resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/25"
            >
              <FaSave />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


