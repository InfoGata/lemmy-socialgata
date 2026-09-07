import { afterEach, describe, expect, it, vi } from "vitest";
import { hostAllowsNsfw } from "./lib/nsfw";

afterEach(() => vi.unstubAllGlobals());

const withHost = (getShowNsfw: unknown) =>
  vi.stubGlobal("application", { getShowNsfw });

describe("hostAllowsNsfw", () => {
  it("passes the host's answer through", async () => {
    withHost(async () => false);
    expect(await hostAllowsNsfw()).toBe(false);

    withHost(async () => true);
    expect(await hostAllowsNsfw()).toBe(true);
  });

  it("falls back to requesting everything when the host rejects", async () => {
    // What an older host actually does: plugin-frame's remote generates a
    // function for any name, so the call is made and then rejects when the host
    // fails to find the method. Requesting everything is what those hosts did
    // before the preference existed, and they have no setting to undo filtering.
    withHost(async () => {
      throw new Error("Cannot read properties of undefined");
    });

    expect(await hostAllowsNsfw()).toBe(true);
  });

  it("falls back when the method is missing outright", async () => {
    // Not what the frame does, but a direct-object host stub can look like this
    // and a TypeError here would take down every search that calls it.
    withHost(undefined);

    expect(await hostAllowsNsfw()).toBe(true);
  });
});
