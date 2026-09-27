import { z } from "zod";
export const fichierAudio = z.object({
 format: z.enum(["mp3", "wav", "webm", "mp4"]),
 base64: z.string().min(24).max(11_184_812).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict();
export type FichierAudio = z.infer<typeof fichierAudio>;
/** Fail closed on format mismatch. Decoder remains the provider's responsibility. */
export function lireAudio(brut: FichierAudio): Buffer {
 const input=fichierAudio.parse(brut), b=Buffer.from(input.base64,"base64");
 if(b.length<16||b.length>8*1024*1024||b.toString("base64")!==input.base64)throw Error("AUDIO_INVALID");
 const valid=input.format==='mp3' ? b.subarray(0,3).toString()==='ID3'||(b[0]===255&&(b[1]&224)===224)
 : input.format==='wav' ? b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WAVE'
 : input.format==='webm' ? b.subarray(0,4).toString('hex')==='1a45dfa3'
 : b.subarray(4,8).toString()==='ftyp';
 if(!valid)throw Error("AUDIO_INVALID");return b;
}
