import Link from 'next/link';
import { getVoiceClones, deleteVoiceClone } from '../../../lib/actions';
import { FaPlus, FaMicrophoneAlt, FaTrash, FaHandSparkles } from 'react-icons/fa';

import RecloneButton from '../../../components/voicecloner/RecloneButton';

export default async function VoiceClonerPage() {
    const voiceClones = await getVoiceClones();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                        Your Voice Clones
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your cloned voices here.</p>
                </div>
                <Link
                    href="/dashboard/voicecloner/new"
                    className="btn-primary px-6 py-2 w-auto inline-flex gap-2"
                >
                    <FaPlus />
                    Add New Clone
                </Link>
            </div>

            {voiceClones.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-xl border-dashed border-2 border-orange-200 bg-orange-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FaMicrophoneAlt className="text-2xl text-orange-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900">No voices cloned yet</h2>
                    <p className="text-gray-500 mb-6">Create your first voice clone to get started.</p>
                    <Link
                        href="/dashboard/voicecloner/new"
                        className="text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                        Add a Voice Clone
                    </Link>
                </div>
            ) : (
                <div className="glass-panel rounded-xl overflow-hidden shadow-sm border border-orange-100">
                    <table className="w-full">
                        <thead className="bg-orange-50 border-b border-orange-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Voice ID</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Created At</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {voiceClones.map((clone) => (
                                <tr key={clone.id} className="hover:bg-orange-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                                                <FaMicrophoneAlt />
                                            </div>
                                            <span className="font-medium text-gray-900">{clone.voice_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                                clone.clone_status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : clone.clone_status === 'failed'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}
                                        >
                                            {clone.clone_status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(clone.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end items-center gap-2">
                                            {clone.clone_status === 'pending' && (
                                                <RecloneButton cloneId={clone.id} />
                                            )}

                                            {clone.clone_status === 'completed' && (
                                                <Link
                                                    href={`/dashboard/voicecloner/${clone.id}/generate-speech`}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                                    title="Generate speech from text"
                                                >
                                                    <FaHandSparkles className="text-[11px]" />
                                                    Generate Speech
                                                </Link>
                                            )}

                                            <form action={deleteVoiceClone}>
                                                <input type="hidden" name="cloneId" value={clone.id} />
                                                <button
                                                    type="submit"
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete voice clone"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
