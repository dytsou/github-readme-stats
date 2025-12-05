import { describe, expect, it } from "vitest";
import { encodeHTML } from "../src/common/html.js";

describe("Test html.js", () => {
  it("should test encodeHTML", () => {
    // escape-html uses named entities: &lt; &gt; &amp; &quot; &#39;
    expect(encodeHTML(`<html>hello world<,.#4^&^@%!))`)).toBe(
      "&lt;html&gt;hello world&lt;,.#4^&amp;^@%!))",
    );
  });
});
