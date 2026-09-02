// The runtime is plain JavaScript copied from the PlatformerGame project; these are its entry points.
declare module "@/lib/sinfeld/game.js";
declare module "@/lib/sinfeld/tv.mjs" {
  export function startSinfeldTv(): Promise<void>;
}
