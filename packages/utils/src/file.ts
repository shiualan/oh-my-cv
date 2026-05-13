import type { Callback } from "./types";

export type FetchFileOptions = {
  maxBytes?: number;
  timeoutMs?: number;
};

const DEFAULT_FETCH_FILE_OPTIONS = {
  maxBytes: 512 * 1024,
  timeoutMs: 10000
};

const assertAllowedRemoteFileUrl = (url: string) => {
  const parsedUrl = new URL(url);
  const isLocalHttp =
    parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname);

  if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
    throw new Error("Only HTTPS URLs can be imported.");
  }

  return parsedUrl;
};

export const fetchFile = async (
  url: string,
  options: FetchFileOptions = {}
): Promise<string> => {
  const { maxBytes, timeoutMs } = { ...DEFAULT_FETCH_FILE_OPTIONS, ...options };
  const parsedUrl = assertAllowedRemoteFileUrl(url);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(parsedUrl.href, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`Request error: ${res.status} ${res.statusText}`);
    }

    const contentLength = Number(res.headers.get("content-length"));

    if (contentLength > maxBytes) {
      throw new Error(`Imported file must be ${maxBytes} bytes or smaller.`);
    }

    const text = await res.text();

    if (new Blob([text]).size > maxBytes) {
      throw new Error(`Imported file must be ${maxBytes} bytes or smaller.`);
    }

    return text;
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

/**
 * Open file dialog with ease. This hook differs from vueuse's useFileDialog in that it
 * doesn't require Vue.
 *
 * @param accept File types to accept
 * @returns
 */
export const useFileDialog = (accept?: string) => {
  let callback: Callback<File> | null = null;

  let input: HTMLInputElement | undefined;

  if (typeof document !== "undefined") {
    input = document.createElement("input");

    input.type = "file";
    input.style.display = "none";
    if (accept) input.accept = accept;

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file && callback) callback(file);
    };
  }

  const open = () => {
    if (!input) return;

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const onChange = (cb: Callback<File>) => {
    callback = cb;
  };

  return {
    open,
    onChange
  };
};

/**
 * Read file content as text.
 *
 * @param file File object
 * @returns Promise containing file content as string
 */
export const readFile = (file: File, maxBytes = 512 * 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`Imported file must be ${maxBytes} bytes or smaller.`));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.readAsText(file);
  });
};

export const downloadFile = (filename: string, content: string) => {
  const element = document.createElement("a");

  element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
  element.download = filename;
  element.style.display = "none";

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
