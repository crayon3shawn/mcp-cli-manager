import { vi } from 'vitest';

export function mockConsole() {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  
  return {
    log,
    error,
    restore: () => {
      log.mockRestore();
      error.mockRestore();
    }
  };
}

export function mockProcess() {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  
  return {
    exit,
    restore: () => {
      exit.mockRestore();
    }
  };
}

export function mockFormatUtils() {
  let formatListResultsMock = vi.fn();
  let formatSearchResultsMock = vi.fn();
  
  vi.doMock('../utils/format.js', () => ({
    formatListResults: formatListResultsMock,
    formatSearchResults: formatSearchResultsMock
  }));
  
  return {
    formatListResults: formatListResultsMock,
    formatSearchResults: formatSearchResultsMock,
    restore: () => {
      vi.doUnmock('../utils/format.js');
    }
  };
} 