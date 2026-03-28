import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
    try {
        // Get user ID from session cookie
        const cookieStore = await cookies();
        const userId = cookieStore.get('session')?.value;

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const voiceId = formData.get('voice_id');
        const audioFile = formData.get('audio');

        if (!voiceId) {
            return NextResponse.json(
                { error: 'Voice name is required' },
                { status: 400 }
            );
        }

        if (!audioFile) {
            return NextResponse.json(
                { error: 'Audio file is required' },
                { status: 400 }
            );
        }

        // Upload audio file to Supabase Storage
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${voiceId}.${fileExt}`;

        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // const { error: uploadError } = await supabase.storage
        //     .from('voice-clones')
        //     .upload(fileName, buffer, {
        //         contentType: audioFile.type,
        //         upsert: false
        //     });

        // if (uploadError) {
        //     console.error('Audio upload error:', uploadError);
        //     return NextResponse.json(
        //         { error: 'Failed to upload audio file' },
        //         { status: 500 }
        //     );
        // }

        // Get the public URL
        // const { data: { publicUrl } } = supabase.storage
        //     .from('voice-clones')
        //     .getPublicUrl(fileName);

        // // Save voice clone to database
        // const { data, error: dbError } = await supabase
        //     .from('voice_clones')
        //     .insert({
        //         user_id: userId,
        //         voice_id: voiceId,
        //     })
        //     .select()
        //     .single();

        // if (dbError) {
        //     console.error('Database error:', dbError);
        //     return NextResponse.json(
        //         { error: 'Failed to save voice clone' },
        //         { status: 500 }
        //     );
        // }

        return NextResponse.json({
            success: true,
            message: 'Voice clone created successfully',
            data: {
                id: data.id,
                voice_id: voiceId,
                audio_url: publicUrl,
            }
        });

    } catch (error) {
        console.error('Voice clone error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
