/**
 * Minimal Prettier plugin for Fluent files.
 *
 * Mirrors @desmos/prettier-plugin-fluent without depending on that package:
 * parse/serialize through @fluent/syntax and sort entries by identifier.
 */

import * as FTL from "@fluent/syntax";
import type { Doc, Parser, Printer, SupportLanguage } from "prettier";

const languages: SupportLanguage[] = [
  {
    name: "Fluent",
    parsers: ["fluent-parse"],
    extensions: [".ftl"],
  },
];

const fluentParser: Parser = {
  parse(text: string): FTL.Resource {
    return FTL.parse(text, { withSpans: true });
  },
  astFormat: "fluent-ast",
  locStart(node: unknown) {
    return node instanceof FTL.Span ? node.start : -1;
  },
  locEnd(node: unknown) {
    return node instanceof FTL.Span ? node.end : -1;
  },
};

const fluentPrinter: Printer = {
  print(path): Doc {
    const node = path.node as FTL.Resource;
    const sortedBody: FTL.Entry[] = [];
    let entries: {
      id: string;
      entry: FTL.Message | FTL.Term;
      leadingJunk: FTL.Junk[];
    }[] = [];
    let currentJunk: FTL.Junk[] = [];

    const flushEntries = () => {
      entries.sort((a, b) => a.id.localeCompare(b.id));
      for (const { entry, leadingJunk } of entries) {
        sortedBody.push(...leadingJunk, entry);
      }
      entries = [];
    };

    const flushJunk = () => {
      sortedBody.push(...currentJunk);
      currentJunk = [];
    };

    for (const item of node.body) {
      if (item instanceof FTL.Junk) {
        currentJunk.push(item);
        continue;
      }

      if (item instanceof FTL.Message || item instanceof FTL.Term) {
        entries.push({
          id: item.id.name,
          entry: item,
          leadingJunk: currentJunk,
        });
        currentJunk = [];
        continue;
      }

      flushEntries();
      flushJunk();
      sortedBody.push(item);
    }

    flushEntries();
    flushJunk();
    node.body = sortedBody;

    return FTL.serialize(node, { withJunk: true });
  },
};

export const parsers: Record<string, Parser> = {
  "fluent-parse": fluentParser,
};

export const printers: Record<string, Printer> = {
  "fluent-ast": fluentPrinter,
};

export { languages };
