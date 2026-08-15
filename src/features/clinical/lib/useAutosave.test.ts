/**
 * Uses react-test-renderer directly (not @testing-library/react-native's
 * renderHook, which loses its fiber across a real `await` under this repo's
 * React 19 + RN 0.81 combo) via a small harness component that exposes the
 * hook's latest return value through a ref.
 */
jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock")
);

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useAutosave, type PerformSaveResult, type UseAutosaveOptions, type UseAutosaveResult } from "./useAutosave";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const renderers: TestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  act(() => {
    renderers.splice(0).forEach((r) => r.unmount());
  });
});

function mount(options: UseAutosaveOptions) {
  const ref: { current: UseAutosaveResult | null } = { current: null };
  function Harness() {
    ref.current = useAutosave({ savedLabelLingerMs: 10, ...options });
    return null;
  }
  act(() => {
    renderers.push(TestRenderer.create(React.createElement(Harness)));
  });
  return ref;
}

describe("useAutosave", () => {
  it("debounces scheduleSave into a single performSave call", async () => {
    let pending = true;
    const performSave = jest.fn<Promise<PerformSaveResult>, []>(async () => {
      pending = false;
      return "ok";
    });
    const result = mount({
      enabled: true,
      hasPendingChanges: () => pending,
      performSave,
      debounceMs: 40,
      maxWaitMs: 500,
    });

    act(() => result.current!.scheduleSave());
    await wait(20);
    act(() => result.current!.scheduleSave()); // resets the debounce timer
    expect(performSave).not.toHaveBeenCalled();

    await wait(60);
    expect(performSave).toHaveBeenCalledTimes(1);
  });

  it("fires within maxWaitMs even under continuous edits", async () => {
    let pending = true;
    const performSave = jest.fn<Promise<PerformSaveResult>, []>(async () => {
      pending = false;
      return "ok";
    });
    const result = mount({
      enabled: true,
      hasPendingChanges: () => pending,
      performSave,
      debounceMs: 40,
      maxWaitMs: 100,
    });

    // Re-schedule faster than the debounce window each tick — only maxWait can save us.
    for (let i = 0; i < 8 && performSave.mock.calls.length === 0; i++) {
      act(() => result.current!.scheduleSave());
      await wait(20);
    }
    expect(performSave).toHaveBeenCalledTimes(1);
  });

  it("retries with backoff on failure and stops once hasPendingChanges is false", async () => {
    let pending = true;
    const performSave = jest.fn<Promise<PerformSaveResult>, []>(async () => "error");
    const result = mount({
      enabled: true,
      hasPendingChanges: () => pending,
      performSave,
      debounceMs: 10,
      maxWaitMs: 500,
      backoffMs: [40, 1000],
    });

    act(() => result.current!.scheduleSave());
    await wait(40);
    expect(performSave).toHaveBeenCalledTimes(1);
    expect(result.current!.status).toBe("error");

    pending = false; // abandon the edit before the retry fires
    await wait(80);
    // runSave bails via hasPendingChanges() before calling performSave again.
    expect(performSave).toHaveBeenCalledTimes(1);
  });

  it("flushNow resolves once a pending save completes", async () => {
    let pending = true;
    const performSave = jest.fn<Promise<PerformSaveResult>, []>(async () => {
      pending = false;
      return "ok";
    });
    const result = mount({ enabled: true, hasPendingChanges: () => pending, performSave });

    await act(async () => {
      await result.current!.flushNow();
    });
    expect(performSave).toHaveBeenCalledTimes(1);
  });

  it("flushNow is a no-op when nothing is pending", async () => {
    const performSave = jest.fn<Promise<PerformSaveResult>, []>(async () => "ok");
    const result = mount({ enabled: true, hasPendingChanges: () => false, performSave });

    await act(async () => {
      await result.current!.flushNow();
    });
    expect(performSave).not.toHaveBeenCalled();
  });
});
