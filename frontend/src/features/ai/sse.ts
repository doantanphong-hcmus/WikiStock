export interface ParsedSseEvent {
  event: string;
  data: unknown;
}

function parseBlock(block: string): ParsedSseEvent | null {
  let event = "";
  const data: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? "" : line.slice(separator + 1).trimStart();

    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }

  if (!event || data.length === 0) return null;
  return { event, data: JSON.parse(data.join("\n")) as unknown };
}

// Giữ lại event chưa nhận đủ vì một gói mạng có thể bị cắt ở bất kỳ ký tự nào.
export function extractSseEvents(input: string, flush = false) {
  const blocks = input.split(/\r?\n\r?\n/);
  let remainder = blocks.pop() ?? "";

  if (flush && remainder.trim()) {
    blocks.push(remainder);
    remainder = "";
  }

  return {
    events: blocks
      .map(parseBlock)
      .filter((event): event is ParsedSseEvent => event !== null),
    remainder,
  };
}
