/**
 * heic-decode ne publie pas de types. Décodeur HEIC/HEIF de repli utilisé quand
 * sharp n'a pas de décodeur HEVC (photos iPhone).
 */
declare module "heic-decode" {
  interface DecodeResult {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }
  function decode(input: { buffer: Buffer | ArrayBuffer | Uint8Array }): Promise<DecodeResult>;
  export default decode;
}
