import { describe, expect, it } from "vitest";
import { format } from "../../dist/index.js";

describe("Fluent support", () => {
  it("should normalize Fluent syntax spacing", async () => {
    const input = `
b=brand
a=abe{$x}
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
a = abe{ $x }
b = brand
`.trim(),
    );
  });

  it("should sort Fluent entries and preserve junk", async () => {
    const input = `
b = Beluga
bad syntax stays with subsequent entry
# comment
a = Abe {$x}
bad syntax at end is preserved
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
bad syntax stays with subsequent entry
# comment
a = Abe { $x }
b = Beluga
bad syntax at end is preserved
`.trim(),
    );
  });

  it("should sort terms and messages by identifier", async () => {
    const input = `
z = Zee
-brand-name = Brand
a = Abe
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
a = Abe
-brand-name = Brand
z = Zee
`.trim(),
    );
  });

  it("should normalize parametric messages", async () => {
    const input = `
welcome=user {$name}
price={NUMBER($value, minimumFractionDigits:2)}
unread-count = { $count ->
[one] One message
*[other] {$count} messages
}
brand = { -brand-name(case: "accusative") }
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
brand = { -brand-name(case: "accusative") }
price = { NUMBER($value, minimumFractionDigits: 2) }
unread-count =
    { $count ->
        [one] One message
       *[other] { $count } messages
    }
welcome = user { $name }
`.trim(),
    );
  });

  it("should sort entries only within each region", async () => {
    const input = `
### Resource

## Region B
b = Bee
a = Abe

## Region A
d = Dee
c = Cee
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
### Resource


## Region B

a = Abe
b = Bee

## Region A

c = Cee
d = Dee
`.trim(),
    );
  });

  it("should preserve loose top-level comments as sort boundaries", async () => {
    const input = `
# Do not move this section comment

b = Bee
a = Abe
`;

    const result = await format("messages.ftl", input);

    expect(result.errors).toStrictEqual([]);
    expect(result.code.trim()).toBe(
      `
# Do not move this section comment

a = Abe
b = Bee
`.trim(),
    );
  });
});
