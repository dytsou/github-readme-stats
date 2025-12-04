// @ts-check

import { describe, expect, it } from "vitest";
import { queryByTestId } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { renderError } from "../src/common/render.js";
import { escapeCSSValue } from "../src/common/html.js";

describe("Test render.js", () => {
  it("should test renderError", () => {
    document.body.innerHTML = renderError({ message: "Something went wrong" });
    expect(
      queryByTestId(document.body, "message")?.children[0],
    ).toHaveTextContent(/Something went wrong/gim);
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toBeEmptyDOMElement();

    // Secondary message
    document.body.innerHTML = renderError({
      message: "Something went wrong",
      secondaryMessage: "Secondary Message",
    });
    expect(
      queryByTestId(document.body, "message")?.children[1],
    ).toHaveTextContent(/Secondary Message/gim);
  });

  it("should reject invalid color values and use safe defaults", () => {
    // Test with XSS attempt in color values - should be rejected by validation
    const maliciousColor = 'red"><script>alert("XSS")</script><svg fill="';
    const svg = renderError({
      message: "Test",
      renderOptions: {
        title_color: maliciousColor,
        text_color: maliciousColor,
        bg_color: maliciousColor,
        border_color: maliciousColor,
      },
    });

    // Verify that invalid colors are rejected and safe defaults are used
    // Invalid hex colors should fall back to theme defaults
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain('alert("XSS")');
    // Verify the SVG is still valid with safe default colors
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    // Should contain safe hex color values (default theme colors)
    expect(svg).toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("should handle special characters in color values by rejecting them", () => {
    const specialChars = "test\"value'with<script>";
    const svg = renderError({
      message: "Test",
      renderOptions: {
        title_color: specialChars,
        text_color: specialChars,
        bg_color: specialChars,
        border_color: specialChars,
      },
    });

    // Invalid colors should be rejected - no special characters should appear
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain('test"value');
    // Should use safe default colors instead
    expect(svg).toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("should handle normal hex color values correctly", () => {
    const normalColor = "ff5733";
    const svg = renderError({
      message: "Test",
      renderOptions: {
        title_color: normalColor,
        text_color: normalColor,
        bg_color: normalColor,
        border_color: normalColor,
      },
    });

    // Normal hex colors should work fine
    expect(svg).toContain("<svg");
  });

  it("should escape CSS values correctly", () => {
    // Test escapeCSSValue function directly
    expect(escapeCSSValue('test"value')).toBe('test\\"value');
    expect(escapeCSSValue("test'value")).toBe("test\\'value");
    expect(escapeCSSValue("test<script>")).toContain("\\3C");
    expect(escapeCSSValue("test>value")).toContain("\\3E");
    expect(escapeCSSValue("test\nvalue")).toContain("\\A");
  });
});
