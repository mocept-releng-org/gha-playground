import * as core from '@actions/core';
import * as glob from '@actions/glob';
import { DefaultArtifactClient } from '@actions/artifact';
import { retry } from './retry';
import { classify } from './classify';

type IfNoFilesFound = 'warn' | 'error' | 'ignore';

function parsePositiveInt(name: string, raw: string, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    throw new Error(`${name}: expected a positive integer, got "${raw}"`);
  }
  return n;
}

function parseIfNoFilesFound(raw: string): IfNoFilesFound {
  if (raw === 'warn' || raw === 'error' || raw === 'ignore') return raw;
  throw new Error(`if-no-files-found: expected warn|error|ignore, got "${raw}"`);
}

async function run(): Promise<void> {
  try {
    const name = core.getInput('name', { required: true });
    const pathInput = core.getInput('path', { required: true });
    const retentionDays = parsePositiveInt('retention-days', core.getInput('retention-days'), 7);
    const ifNoFilesFound = parseIfNoFilesFound(core.getInput('if-no-files-found') || 'warn');
    const maxAttempts = parsePositiveInt('max-attempts', core.getInput('max-attempts'), 3);

    const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();

    const globber = await glob.create(pathInput, { matchDirectories: false });
    const files = await globber.glob();

    if (files.length === 0) {
      const msg = `no files matched path "${pathInput}"`;
      if (ifNoFilesFound === 'error') throw new Error(msg);
      if (ifNoFilesFound === 'warn') core.warning(msg);
      core.setOutput('artifact-id', '');
      core.setOutput('artifact-url', '');
      core.setOutput('size', '0');
      core.setOutput('attempts', '0');
      return;
    }

    core.info(`Uploading ${files.length} file(s) as artifact "${name}"`);

    const client = new DefaultArtifactClient();

    const result = await retry(
      async () => client.uploadArtifact(name, files, workspace, { retentionDays }),
      { maxAttempts, baseMs: 1000, capMs: 30000, jitterMs: 1000 },
      (err) => classify(err).retryable,
    );

    const upload = result.value;
    if (!upload.id) {
      throw new Error('uploadArtifact returned no id');
    }

    const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
    const repo = process.env.GITHUB_REPOSITORY ?? '';
    const runId = process.env.GITHUB_RUN_ID ?? '';
    const url = repo && runId
      ? `${server}/${repo}/actions/runs/${runId}/artifacts/${upload.id}`
      : '';

    core.setOutput('artifact-id', String(upload.id));
    core.setOutput('artifact-url', url);
    core.setOutput('size', String(upload.size ?? 0));
    core.setOutput('attempts', String(result.attempts));

    const attemptsLine = result.attempts === 1
      ? 'succeeded on first try'
      : `succeeded after ${result.attempts} attempts`;

    await core.summary
      .addHeading('publish-artifact')
      .addRaw(`Artifact **${name}** ${attemptsLine}.`, true)
      .addList([
        `id: ${upload.id}`,
        `size: ${upload.size ?? 0} bytes`,
        `files: ${files.length}`,
        url ? `url: ${url}` : 'url: (unavailable)',
      ])
      .write();
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
