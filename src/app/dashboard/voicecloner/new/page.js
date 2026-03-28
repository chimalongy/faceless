'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaMicrophoneAlt, FaUpload, FaPlay, FaPause, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function NewVoiceClonePage() {
    const router = useRouter();
    const [voiceId, setVoiceId] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('audio/')) {
                toast.error('Please upload an audio file');
                return;
            }
            setAudioFile(file);
        }
    };

    const handleRemoveFile = () => {
        setAudioFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!voiceId.trim()) {
            toast.error('Please enter a voice name');
            return;
        }

        if (!audioFile) {
            toast.error('Please upload an audio file');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('voice_id', voiceId.trim());
            formData.append('audio', audioFile);

            const response = await fetch('/api/voice-clone', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(response)
                throw new Error(result.error || 'Failed to create voice clone');
            }

            toast.success('Voice clone created successfully!');
            router.push('/dashboard/voicecloner');
        } catch (error) {
            console.error('Error creating voice clone:', error);
            toast.error(error.message || 'Failed to create voice clone');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <Link
                    href="/dashboard/voicecloner"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors mb-4"
                >
                    <FaArrowLeft />
                    Back to Voice Clones
                </Link>
                <h1 className="text-3xl font-bold bg-green from-orange-600 to-amber-500 bg-clip-text text-transparent">
                    Add New Voice Clone
                </h1>
                <p className="text-gray-500 mt-1">Upload an audio file and give your voice clone a name.</p>
            </div>

            <div className="glass-panel rounded-xl p-8 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-orange-50 rounded-xl text-orange-500">
                        <FaMicrophoneAlt className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Voice Clone Details</h2>
                        <p className="text-sm text-gray-500">Provide an audio sample and a name for your voice clone.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Voice Name/ID Field */}
                    <div>
                        <label htmlFor="voice_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Voice Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="voice_id"
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                            required
                            placeholder="e.g., My Custom Voice"
                            className="input-field"
                        />
                        <p className="mt-2 text-sm text-gray-400">
                            Give your cloned voice a memorable name.
                        </p>
                    </div>

                    {/* Audio Upload Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Audio Sample <span className="text-red-500">*</span>
                        </label>

                        {!audioFile ? (
                            <div
                                className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer bg-orange-50/30"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FaUpload className="text-orange-500" />
                                </div>
                                <p className="text-gray-700 font-medium mb-1">Click to upload audio file</p>
                                <p className="text-sm text-gray-400">MP3, WAV, or other audio formats</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={togglePlayback}
                                            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors"
                                        >
                                            {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                                        </button>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                                {audioFile.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <audio
                                    ref={audioRef}
                                    src={URL.createObjectURL(audioFile)}
                                    onEnded={() => setIsPlaying(false)}
                                    className="hidden"
                                />
                            </div>
                        )}
                        <p className="mt-2 text-sm text-gray-400">
                            Upload a clear audio sample of the voice you want to clone.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Link
                            href="/dashboard/voicecloner"
                            className="flex-1 py-3 px-6 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Clone Voice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
