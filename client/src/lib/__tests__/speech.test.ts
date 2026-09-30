import test from "node:test";
import assert from "node:assert/strict";
import { requestMicrophoneAccess } from "../speech.js";

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
