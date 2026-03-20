/**
 * AI Service - Classroom and exam monitoring
 */
import {
  aiGenerateWithImages,
  aiGenerateWithImageAndAudio,
  aiTranscribeAudio,
} from '../providers/unified.js';
import { withGeminiFallback } from './utils.js';
import { analyzeSentiment, getSafeDisplayText } from './sentiment.js';

export async function analyzeSessionMonitoring(
  sessionId: string,
  frames: { studentFrame?: string; teacherFrame?: string; audioLevel?: number }
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withGeminiFallback(
    async () => {
      if (frames.studentFrame && frames.teacherFrame) {
        const result = await aiGenerateWithImages(
          'Analyze these two images from an online tutoring session. Image 1: student view. Image 2: teacher view. Is the session appropriate and safe? Reply with JSON only: { "alert": false or true, "type": "reason if alert", "message": "brief message" }',
          [frames.studentFrame, frames.teacherFrame]
        );
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch?.[0]) {
          return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
        }
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Single-frame analysis during exam: alone? no phone/book? face visible? camera covered? */
export async function analyzeExamFrame(
  studentFrame: string
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withGeminiFallback(
    async () => {
      const result = await aiGenerateWithImages(
        `Analyze this webcam frame from an online exam. Strictly check:
1. Is the person ALONE? (no other people in frame, background, or reflection)
2. Is the person's FACE clearly visible and facing the camera/screen?
3. PERSON CHANGED? Different face/person than expected - flag if identity appears to have switched.
4. SCREEN CLEAR? Camera not blurry, dark, obstructed, blank/black, or showing ceiling/wall.
5. No phone, tablet, book, notes, second screen, or cheat materials visible?
6. Person not looking away from screen (e.g. at phone, another person, notes)?
7. No attempt to cover camera or obstruct view?

Flag alert=true if ANY: multiple people, person changed, extra person, phone/device, book/notes, face not visible, screen unclear, looking away, camera covered/blank, suspicious activity.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user-facing message" }`,
        [studentFrame]
      );
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Combined video + audio analysis for live exam monitoring. Includes speech-to-text transcript for audit. */
export async function analyzeExamFrameWithAudio(
  studentFrame: string,
  audioDataUrl?: string | null
): Promise<{
  alert: boolean;
  type?: string;
  message?: string;
  transcript?: string;
  transcriptDisplay?: string;
  transcriptSentimentScore?: number;
  transcriptWarning?: boolean;
}> {
  let transcript = '';
  if (audioDataUrl?.trim()) {
    try {
      transcript = await aiTranscribeAudio(audioDataUrl);
    } catch {
      transcript = '';
    }
  }

  let transcriptDisplay = transcript;
  let transcriptSentimentScore: number | undefined;
  let transcriptWarning = false;
  if (transcript.trim().length >= 2) {
    const sentimentResult = await analyzeSentiment(transcript);
    transcriptSentimentScore = sentimentResult.score;
    const { text: safeText, warning } = getSafeDisplayText(transcript, sentimentResult);
    transcriptDisplay = safeText;
    transcriptWarning = warning;
    if (sentimentResult.score < 0.3) {
      transcriptDisplay = safeText;
    }
  }

  const transcriptSection = transcript
    ? `\n\nSPEECH-TO-TEXT TRANSCRIPT (what was heard):\n"${transcript}"\n\nUse this transcript to detect: someone dictating answers, reading from notes, another person helping, suspicious conversation. Flag alert=true if transcript suggests cheating.`
    : '';

  return withGeminiFallback(
    async () => {
      const prompt = `STRICT exam proctoring. Analyze this webcam frame and audio. You MUST flag alert=true for ANY violation.

VIDEO - Flag alert=true if:
1. MULTIPLE PEOPLE: More than one person visible (face, body, in background, reflection, mirror). Even one extra person = alert.
2. PERSON CHANGED: Different person than expected (face changed, someone else in frame). Flag if identity appears to have switched.
3. PERSON LEFT/ABSENT: No clear face visible, person left the frame, only showing empty chair/room, back of head, or person turned away.
4. SCREEN/CAMERA NOT CLEAR: Image too dark, too bright/washed out, blurry, obstructed, camera showing ceiling/wall/blank/black, or view is unclear for proper monitoring.
5. DEVICES: Phone, tablet, second screen, laptop, book, notes, cheat materials, or any external aid visible.
6. LOOKING AWAY: Person clearly looking at phone, another person, notes, second screen, or away from exam screen.
7. SUSPICIOUS: Any attempt to obstruct view, cover camera, or hide activity.

AUDIO - Flag alert=true if:
8. MULTIPLE VOICES: Someone else speaking, helping, dictating answers, or background conversation.
9. EXCESSIVE NOISE: TV, music, loud background noise, or suspicious sounds.
10. TRANSCRIPT CHEATING: If transcript provided, flag if someone appears to be dictating answers, reading from notes, or receiving help.${transcriptSection}

BE STRICT. When in doubt, flag. Better to warn than miss cheating.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user-facing message" }`;

      const result = await aiGenerateWithImageAndAudio(prompt, studentFrame, audioDataUrl);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        const parsed = JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
        return {
          ...parsed,
          transcript: transcript || undefined,
          transcriptDisplay: transcriptDisplay || undefined,
          transcriptSentimentScore,
          transcriptWarning: transcriptWarning || undefined,
        };
      }
      return {
        alert: false,
        transcript: transcript || undefined,
        transcriptDisplay: transcriptDisplay || undefined,
        transcriptSentimentScore,
        transcriptWarning: transcriptWarning || undefined,
      };
    },
    {
      alert: false,
      transcript: transcript || undefined,
      transcriptDisplay: transcriptDisplay || undefined,
      transcriptSentimentScore,
      transcriptWarning: transcriptWarning || undefined,
    }
  );
}

/** Single-frame classroom analysis (student or teacher view). Strict AI inspection. */
export async function analyzeClassroomFrame(
  frame: string,
  role: 'student' | 'teacher',
  referencePhotoUrl?: string | null
): Promise<{ alert: boolean; type?: string; message?: string }> {
  return withGeminiFallback(
    async () => {
      const roleDesc = role === 'student' ? 'student' : 'teacher';
      const images = referencePhotoUrl ? [frame, referencePhotoUrl] : [frame];
      const faceMatchPrompt = referencePhotoUrl
        ? `Image 1: Current webcam. Image 2: Stored ${roleDesc} photo. Does the face in Image 1 match Image 2? Flag if mismatch. `
        : '';
      const result = await aiGenerateWithImages(
        `STRICT AI inspection for online class. This is the ${roleDesc}'s webcam view.
${faceMatchPrompt}
Check ALL:
1. Camera ON - face clearly visible, not black/blank/covered
2. Microphone implied ON - person present and engaged
3. Video/sound quality - clear view, no heavy obstruction
4. NO extra person in background - must be alone
5. NO extra noise/distraction - clean environment
6. Person must match stored ${roleDesc} photo (if provided) - flag face_mismatch if different
7. No foul language, inappropriate content, phones, notes, cheating materials
8. Board/desk area neat and clean (for teacher)

Flag alert=true for: camera_off, voice_off, face_mismatch, extra_person, background_noise, foul_language, absent, cheating, other.
Reply with JSON only: { "alert": true/false, "type": "reason if alert", "message": "brief user message" }`,
        images
      );
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch?.[0]) {
        return JSON.parse(jsonMatch[0]) as { alert: boolean; type?: string; message?: string };
      }
      return { alert: false };
    },
    { alert: false }
  );
}

/** Transcribe audio to text (speech-to-text for exam monitoring) */
export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  if (!audioDataUrl?.trim()) return '';
  return withGeminiFallback(
    async () => aiTranscribeAudio(audioDataUrl),
    ''
  );
}

/** Verify document photo matches profile photo */
export async function verifyDocumentPhoto(
  documentImageUrl: string,
  profilePhotoUrl: string
): Promise<'verified' | 'not_verified' | 'partially_verified'> {
  return withGeminiFallback(
    async () => {
      const result = await aiGenerateWithImages(
        `You are verifying identity documents. Image 1: ID proof document (Aadhaar/Passport etc). Image 2: Student/person photo.
        Does the photo on the ID document match the person in the second photo? Consider face similarity.
        Reply with exactly one word: verified, not_verified, or partially_verified.`,
        [documentImageUrl, profilePhotoUrl]
      );
      const lower = result.trim().toLowerCase();
      if (lower.includes('not_verified')) return 'not_verified';
      if (lower.includes('partially')) return 'partially_verified';
      return 'verified';
    },
    'verified'
  );
}
