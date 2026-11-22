import { describe, expect, it } from "vitest";
import { sniffFileType } from "../validation";

describe("sniffFileType", () => {
  it("identifies files by magic bytes, not extension", () => {
    expect(sniffFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(sniffFileType(new TextEncoder().encode("%PDF-1.7 hello"))).toBe("application/pdf");
    expect(sniffFileType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});
