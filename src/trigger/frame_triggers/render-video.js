import { task, logger } from "@trigger.dev/sdk/v3";
import { supabase } from "../../lib/supabase.js";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import axios from "axios";

const BUCKET = process.env.SUPABASE_BUCKET;

// ─────────────────────────────────────────────
// Temp dir
// ─────────────────────────────────────────────

const TEMP_DIR = path.join(process.cwd(), "temp_render");

function ensureTempDir() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function tempFile(name) {
    return path.join(TEMP_DIR, name);
}

// ─────────────────────────────────────────────
// Parse ASS subtitles (mirrors parseAss.ts)
// ─────────────────────────────────────────────

function parseAssTime(timeStr) {
    const [h, m, rest] = timeStr.split(":");
    const [s, cs] = rest.split(".");
    return (
        parseInt(h, 10) * 3600 +
        parseInt(m, 10) * 60 +
        parseInt(s, 10) +
        parseInt(cs, 10) / 100
    );
}

function parseAss(assContent) {
    const lines = assContent.split("\n");
    const cues = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("Dialogue:")) continue;
        const parts = trimmed.split(",");
        if (parts.length < 10) continue;
        const start = parseAssTime(parts[1].trim());
        const end = parseAssTime(parts[2].trim());
        const rawText = parts.slice(9).join(",").trim();
        let text = rawText
            .replace(/\{[^}]*\}/g, "")
            .replace(/\\N/g, "\n")
            .replace(/\\n/g, "\n")
            .trim();
        text = text.replace(/\\/g, " ");
        if (text.length > 0) {
            cues.push({ start, end, text });
        }
    }
    return cues;
}

// ─────────────────────────────────────────────
// Normalize Ken Burns direction (mirrors VideoTemplate.tsx)
// ─────────────────────────────────────────────

function normalizeDirection(direction) {
    const map = {
        in: "zoom-in",
        out: "zoom-out",
        "zoom in": "zoom-in",
        "zoom out": "zoom-out",
        left: "pan-left",
        right: "pan-right",
        up: "pan-up",
        down: "pan-down",
    };
    return map[direction?.toLowerCase()] ?? direction ?? "zoom-in";
}

// ─────────────────────────────────────────────
// Build ffmpeg zoompan filter for Ken Burns
// Uses incremental zoom (zoom+step) instead of
// absolute (intensity*on/d) to eliminate the
// zoompan feedback-loop jitter/shakiness bug.
// scale=8000:-1 prescale gives zoompan enough
// resolution to avoid pixel-boundary jitter.
// ─────────────────────────────────────────────

function buildKenBurnsFilter(slide, fps, totalFrames) {
    const direction = normalizeDirection(slide.kenBurns?.direction ?? "zoom-in");
    const intensity = Math.max(0.05, Math.min(0.5, slide.kenBurns?.intensity ?? 0.1));

    const W = 1280;
    const H = 720;
    const d = totalFrames;

    let z, x, y;

    switch (direction) {
        case "zoom-in":
            z = `if(eq(on,1),1,zoom+${intensity / d})`;
            x = `iw/2-(iw/zoom/2)`;
            y = `ih/2-(ih/zoom/2)`;
            break;

        case "zoom-out":
            z = `if(eq(on,1),${1 + intensity},zoom-${intensity / d})`;
            x = `iw/2-(iw/zoom/2)`;
            y = `ih/2-(ih/zoom/2)`;
            break;

        case "pan-left":
            z = "1";
            x = `iw/2-(iw/zoom/2)+${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)`;
            break;

        case "pan-right":
            z = "1";
            x = `iw/2-(iw/zoom/2)-${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)`;
            break;

        case "pan-up":
            z = "1";
            x = `iw/2-(iw/zoom/2)`;
            y = `ih/2-(ih/zoom/2)+${(10 * intensity) / d}*on*(ih/720)`;
            break;

        case "pan-down":
            z = "1";
            x = `iw/2-(iw/zoom/2)`;
            y = `ih/2-(ih/zoom/2)-${(10 * intensity) / d}*on*(ih/720)`;
            break;

        case "up-left":
            z = "1";
            x = `iw/2-(iw/zoom/2)+${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)+${(10 * intensity) / d}*on*(ih/720)`;
            break;

        case "up-right":
            z = "1";
            x = `iw/2-(iw/zoom/2)-${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)+${(10 * intensity) / d}*on*(ih/720)`;
            break;

        case "down-left":
            z = "1";
            x = `iw/2-(iw/zoom/2)+${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)-${(10 * intensity) / d}*on*(ih/720)`;
            break;

        case "down-right":
            z = "1";
            x = `iw/2-(iw/zoom/2)-${(10 * intensity) / d}*on*(iw/1280)`;
            y = `ih/2-(ih/zoom/2)-${(10 * intensity) / d}*on*(ih/720)`;
            break;

        default:
            z = "1";
            x = `iw/2-(iw/zoom/2)`;
            y = `ih/2-(ih/zoom/2)`;
    }

    // scale=8000:-1 prescales the image to high resolution before zoompan
    // so the filter has enough pixels to interpolate smoothly without jitter
    return `scale=8000:-1,zoompan=z='${z}':x='${x}':y='${y}':d=${d}:s=${W}x${H}:fps=${fps}`;
}

// ─────────────────────────────────────────────
// Build opacity/fade filter for a slide
// Mirrors SlideRenderer transition logic exactly.
// ─────────────────────────────────────────────

function buildFadeFilter(slide, fps, totalFrames) {
    const transitionFrames = Math.min(15, Math.floor(totalFrames / 4));
    const fadeInEnd = Math.max(1, transitionFrames);
    const fadeOutStart = Math.max(fadeInEnd + 1, totalFrames - transitionFrames);

    const fadeInDuration = fadeInEnd / fps;
    const fadeOutStartSec = fadeOutStart / fps;
    const fadeOutDuration = (totalFrames - fadeOutStart) / fps;

    switch (slide.transition) {
        case "fade":
        case "fade-to-black":
        case "fade-to-white":
            if (totalFrames >= 4) {
                return (
                    `fade=t=in:st=0:d=${fadeInDuration.toFixed(3)},` +
                    `fade=t=out:st=${fadeOutStartSec.toFixed(3)}:d=${fadeOutDuration.toFixed(3)}`
                );
            }
            return "";

        case "crossfade":
            if (totalFrames >= 2) {
                const crossDuration = Math.max(1, transitionFrames) / fps;
                return `fade=t=in:st=0:d=${crossDuration.toFixed(3)}`;
            }
            return "";

        default:
            return "";
    }
}

// ─────────────────────────────────────────────
// Download a file from URL to local path
// ─────────────────────────────────────────────

async function downloadFile(url, dest) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(dest, Buffer.from(response.data));
}

// ─────────────────────────────────────────────
// Build SRT subtitle file from ASS cues
// ─────────────────────────────────────────────

function secondsToSrtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.round((sec - Math.floor(sec)) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function buildSrtFile(cues) {
    return cues
        .map((cue, i) => {
            return `${i + 1}\n${secondsToSrtTime(cue.start)} --> ${secondsToSrtTime(cue.end)}\n${cue.text}\n`;
        })
        .join("\n");
}

// ─────────────────────────────────────────────
// Render a single slide to a video clip
// ─────────────────────────────────────────────

async function renderSlideClip(slide, index, fps, jobId) {
    const totalFrames = Math.ceil(slide.duration * fps);
    const duration = slide.duration;

    const imgPath = tempFile(`${jobId}_slide_${index}.jpg`);
    await downloadFile(slide.image, imgPath);

    const clipPath = tempFile(`${jobId}_clip_${index}.mp4`);

    const kenBurnsFilter = buildKenBurnsFilter(slide, fps, totalFrames);
    const fadeFilter = buildFadeFilter(slide, fps, totalFrames);

    let vf = kenBurnsFilter;
    if (fadeFilter) vf += `,${fadeFilter}`;

    const cmd = [
        `ffmpeg -y`,
        `-loop 1 -i "${imgPath}"`,
        `-t ${duration}`,
        `-vf "${vf}"`,
        `-r ${fps}`,
        `-c:v libx264 -preset fast -pix_fmt yuv420p`,
        `-an`,
        `"${clipPath}"`,
    ].join(" ");

    logger.log(`Rendering slide ${index}`, { cmd });
    execSync(cmd, { stdio: "pipe" });

    fs.unlinkSync(imgPath);

    return clipPath;
}

// ─────────────────────────────────────────────
// renderVideo task
// ─────────────────────────────────────────────

export const renderVideo = task({
    id: "render-video",
    machine: "large-1x",
    maxDuration: 30000,

    run: async (payload) => {
        const {
            scene_frame_upload_destination,
            slides,
            audioUrl,
            assContent,
            audioDuration,
            backgroundColor = "black",
            fps = 30,
        } = payload;

        ensureTempDir();

        const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        logger.info("renderVideo started", { jobId, slideCount: slides.length, fps });

        const clipPaths = [];
        const concatListPath = tempFile(`${jobId}_concat.txt`);
        const silentVideoPath = tempFile(`${jobId}_silent.mp4`);
        const audioPath = tempFile(`${jobId}_audio`);
        const outputPath = tempFile(`${jobId}_output.mp4`);
        const srtPath = tempFile(`${jobId}_subtitles.srt`);

        try {
            // ── 1. Render each slide to a clip ──────────────────
            for (let i = 0; i < slides.length; i++) {
                logger.log(`Rendering slide ${i + 1}/${slides.length}`);
                const clipPath = await renderSlideClip(slides[i], i, fps, jobId);
                clipPaths.push(clipPath);
            }

            // ── 2. Concatenate all clips ─────────────────────────
            const concatContent = clipPaths.map((p) => `file '${p}'`).join("\n");
            fs.writeFileSync(concatListPath, concatContent);

            execSync(
                `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${silentVideoPath}"`,
                { stdio: "pipe" }
            );

            logger.log("Clips concatenated");

            // ── 3. Download audio + burn subtitles + mux ────────
            let finalOutputPath = silentVideoPath;

            if (audioUrl) {
                const audioExt = audioUrl.split("?")[0].split(".").pop() || "mp3";
                const audioFilePath = audioPath + "." + audioExt;

                await downloadFile(audioUrl, audioFilePath);
                logger.log("Audio downloaded");

                let videoBeforeAudio = silentVideoPath;

                if (assContent) {
                    const cues = parseAss(assContent);

                    if (cues.length > 0) {
                        const srtContent = buildSrtFile(cues);
                        fs.writeFileSync(srtPath, srtContent);

                        const subtitledPath = tempFile(`${jobId}_subtitled.mp4`);
                        const srtEscaped = srtPath.replace(/'/g, "\\'").replace(/:/g, "\\:");

                        execSync(
                            `ffmpeg -y -i "${silentVideoPath}" ` +
                            `-vf "subtitles='${srtEscaped}':force_style='Fontname=Tahoma,Fontsize=28,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H99000000,BorderStyle=3,Outline=3,Shadow=0,Alignment=2,MarginV=60'" ` +
                            `-c:v libx264 -preset fast -pix_fmt yuv420p -an "${subtitledPath}"`,
                            { stdio: "pipe" }
                        );

                        videoBeforeAudio = subtitledPath;
                        logger.log("Subtitles burned in");
                    }
                }

                // ── 4. Mux audio + video ─────────────────────────
                const muxedPath = tempFile(`${jobId}_muxed.mp4`);

                execSync(
                    `ffmpeg -y -i "${videoBeforeAudio}" -i "${audioFilePath}" ` +
                    `-c:v copy -c:a aac -b:a 192k -shortest "${muxedPath}"`,
                    { stdio: "pipe" }
                );

                finalOutputPath = muxedPath;
                logger.log("Audio muxed");

            } else if (assContent) {
                // No audio but subtitles present
                const cues = parseAss(assContent);

                if (cues.length > 0) {
                    const srtContent = buildSrtFile(cues);
                    fs.writeFileSync(srtPath, srtContent);

                    const subtitledPath = tempFile(`${jobId}_subtitled.mp4`);
                    const srtEscaped = srtPath.replace(/'/g, "\\'").replace(/:/g, "\\:");

                    execSync(
                        `ffmpeg -y -i "${silentVideoPath}" ` +
                        `-vf "subtitles='${srtEscaped}':force_style='Fontname=Tahoma,Fontsize=28,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H99000000,BorderStyle=3,Outline=3,Shadow=0,Alignment=2,MarginV=60'" ` +
                        `-c:v libx264 -preset fast -pix_fmt yuv420p "${subtitledPath}"`,
                        { stdio: "pipe" }
                    );

                    finalOutputPath = subtitledPath;
                }
            }

            // ── 5. Upload to Supabase ────────────────────────────
            logger.log("Uploading to Supabase", { path: scene_frame_upload_destination });

            const fileBuffer = fs.readFileSync(finalOutputPath);

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(scene_frame_upload_destination, fileBuffer, {
                    contentType: "video/mp4",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(scene_frame_upload_destination);

            const publicUrl = data.publicUrl;

            logger.log("Upload complete", { publicUrl });

            return {
                success: true,
                videoUrl: publicUrl,
            };

        } catch (error) {
            logger.error("renderVideo failed", { error: error.message });

            return {
                success: false,
                videoUrl: null,
                error: error.message ?? "Unknown error",
            };

        } finally {
            // ── Cleanup all temp files ──────────────────────────
            const filesToClean = [
                ...clipPaths,
                concatListPath,
                silentVideoPath,
                outputPath,
                srtPath,
                audioPath + ".mp3",
                audioPath + ".wav",
                audioPath + ".m4a",
                audioPath + ".ogg",
                tempFile(`${jobId}_subtitled.mp4`),
                tempFile(`${jobId}_muxed.mp4`),
            ];

            for (const f of filesToClean) {
                try {
                    if (fs.existsSync(f)) fs.unlinkSync(f);
                } catch { }
            }
        }
    },
});