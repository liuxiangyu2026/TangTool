declare module "gifenc" {
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: { format?: string; oneBitAlpha?: boolean }): number[][];
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: number[][], format?: string): Uint8Array;
  export function GIFEncoder(): {
    writeFrame(indexed: Uint8Array, width: number, height: number, options: { palette: number[][]; transparent?: boolean; transparentIndex?: number; repeat?: number }): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}
