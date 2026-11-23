export type ToolCallRecord = {
  name: string;
  arguments: Record<string, unknown>;
  result: string;
};

export type ToolHandler = (args: unknown) => Promise<string>;
