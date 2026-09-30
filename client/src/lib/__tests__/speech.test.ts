import test from "node:test";
import assert from "node:assert/strict";
import { prefersRecordedDictation, requestMicrophoneAccess, startRecordedDictation } from "../speech.js";

test("iPhone and touch iPad use recorded dictation instead of looping WebKit recognition", () => {
  assert.equal(prefersRecordedDictation("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)", "iPhone", 5), true);
  assert.equal(prefersRecordedDictation("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", 5), true);
  assert.equal(prefersRecordedDictation("Mozilla/5.0 (X11; Linux x86_64)", "Linux x86_64", 0), false);
});

test("recorded dictation keeps one stream, emits spoken audio and closes cleanly", async () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const key of ["navigator", "window", "MediaRecorder"]) originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  let stoppedTracks = 0;
  let ended = 0;
  const stream = { getTracks: () => [{ stop: () => { stoppedTracks += 1; } }] };
  class FakeRecorder {
    static isTypeSupported(type: string) { return type === "audio/mp4"; }
    state = "inactive";
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onerror: (() => void) | null = null;
    onstop: (() => void) | null = null;
    constructor(_stream: unknown, _options: unknown) {}
    start() { this.state = "recording"; }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob([new Uint8Array(64)], { type: "audio/mp4" }) });
      this.onstop?.();
    }
  }
  class FakeAudioContext {
    state = "running";
    createAnalyser() {
      return { fftSize: 0, getByteTimeDomainData: (samples: Uint8Array) => samples.fill(160) };
    }
    createMediaStreamSource() { return { connect: () => undefined }; }
    close() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
  }
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { mediaDevices: { getUserMedia: async () => stream } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: FakeAudioContext } });
  Object.defineProperty(globalThis, "MediaRecorder", { configurable: true, value: FakeRecorder });
  const chunks: Blob[] = [];
  try {
    const control = await startRecordedDictation({
      onChunk: ({ blob }) => chunks.push(blob),
      onError: (message) => assert.fail(message),
      onEnd: () => { ended += 1; },
    });
    assert.ok(control);
    await new Promise((resolve) => setTimeout(resolve, 120));
    await control.stop();
    assert.equal(chunks.length, 1);
    assert.equal(stoppedTracks, 1);
    assert.equal(ended, 1);
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as Record<string, unknown>)[key];
    }
  }
});

test("microphone permission is requested and every temporary track is stopped", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let stopped = 0;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => { stopped += 1; } }, { stop: () => { stopped += 1; } }] }) },
  } });
  try {
    assert.deepEqual(await requestMicrophoneAccess(), { ok: true, message: "" });
    assert.equal(stopped, 2);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete (globalThis as { navigator?: unknown }).navigator;
  }
});

test("a refused microphone returns actionable settings guidance", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    mediaDevices: { getUserMedia: async () => { throw new DOMException("denied", "NotAllowedError"); } },
  } });
  try {
    const result = await requestMicrophoneAccess();
    assert.equal(result.ok, false);
    assert.match(result.message, /réglages du navigateur/i);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete (globalThis as { navigator?: unknown }).navigator;
  }
});
