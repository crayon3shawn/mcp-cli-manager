import { describe, it, expect } from 'vitest';
import { Command } from 'commander';

describe('CLI', () => {
  it('should create Command instance', () => {
    const program = new Command();
    expect(program).toBeInstanceOf(Command);
  });
}); 