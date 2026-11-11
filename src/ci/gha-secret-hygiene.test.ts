import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const prAgent = readFileSync(
  resolve(__dirname, '../../.github/workflows/pr-agent.yml'),
  'utf8',
);

describe('pr-agent workflow secret hygiene', () => {
  it('does not trigger on pull_request', () => {
    // Same-repo pull_request runs the PR-head workflow with repo secrets.
    // A collaborator can rewrite this file (or add another) and inherit OPENAI_KEY.
    const onBlock = prAgent.match(/^on:\n((?:[ \t].*\n)+)/m);
    expect(onBlock, 'expected an `on:` block').toBeTruthy();
    expect(onBlock?.[1] ?? '').not.toMatch(/^\s*pull_request:/m);
  });

  it('does not unconditionally map OPENAI_KEY', () => {
    expect(prAgent).not.toMatch(/OPENAI_KEY:\s*\$\{\{\s*secrets\.OPENAI_KEY\s*\}\}/);
  });
});
