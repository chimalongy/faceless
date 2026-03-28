import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaMicrophoneAlt } from 'react-icons/fa';
import { getSessionCookie } from '../../../../../lib/auth';
import { supabase } from '../../../../../lib/supabase';
import GenerateSpeechFromTextForm from '../../../../../components/voicecloner/GenerateSpeechFromTextForm';

export default async function GenerateSpeechPage({ params }) {
  const userId = await getSessionCookie();
  if (!userId) notFound();

  const { cloneId } = await params;

  const { data: clone } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('id', cloneId)
    .eq('user_id', userId)
    .single();

  if (!clone) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/dashboard/voicecloner"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors mb-4"
        >
          <FaArrowLeft />
          Back to Voice Clones
        </Link>

        <div className="flex items-start gap-4">
          <div className="p-4 bg-orange-50 rounded-xl text-orange-500">
            <FaMicrophoneAlt className="text-2xl" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Generate Speech From Text
            </h1>
            
            <p className="text-gray-500">
              Voice: <span className="font-medium text-gray-800">{clone.voice_id}</span>
            </p>
            {clone.clone_status !== 'completed' && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
                This voice clone is <span className="font-semibold">{clone.clone_status}</span>. Speech generation is only available when it’s completed.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-8 border border-orange-100 shadow-sm">
        <GenerateSpeechFromTextForm cloneId={clone.id} />
      </div>
    </div>
  );
}


