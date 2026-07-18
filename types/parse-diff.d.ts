declare module "parse-diff" {
  export type DiffChange =
    | { type: "normal"; normal: true; content: string; ln1?: number; ln2?: number }
    | { type: "add"; add: true; content: string; ln?: number }
    | { type: "del"; del: true; content: string; ln?: number };

  export type DiffChunk = {
    content: string;
    changes: DiffChange[];
    oldStart?: number;
    oldLines?: number;
    newStart?: number;
    newLines?: number;
  };

  export type DiffFile = {
    from?: string;
    to?: string;
    chunks?: DiffChunk[];
    deleted?: boolean;
    new?: boolean;
  };

  export default function parseDiff(diff: string): DiffFile[];
}
