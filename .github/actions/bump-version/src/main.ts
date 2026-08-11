import * as core from '@actions/core';
import { bump } from './bump';

async function run(): Promise<void> {
  try {
    // 1. Read inputs
    const currentInput = core.getInput('current-version');    // '' if not provided
    const bumpType = core.getInput('bump', { required: true }) as 'major' | 'minor' | 'patch';

    // 2. Validate bump type EARLY — fail with a clear message
    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      throw new Error(`bump: expected one of major|minor|patch, got "${bumpType}"`);
    }

    // 3. Determine the current version.
    //    If currentInput is empty, fall back to reading the latest matching tag.
    //    For today, we KEEP IT SIMPLE: require the input. Git-tag fallback is Day 5.
    if (!currentInput) {
      throw new Error('current-version input is required (git-tag fallback comes on Day 5)');
    }

    const previousVersion = currentInput;
    const newVersion = bump(previousVersion, bumpType);

    // 4. Emit outputs
    core.setOutput('previous-version', previousVersion);
    core.setOutput('new-version', newVersion);

    // 5. Log + summary
    core.info(`Bumped ${previousVersion} → ${newVersion} (${bumpType})`);

    await core.summary
      .addHeading('bump-version')
      .addRaw(`**${previousVersion}** → **${newVersion}** (${bumpType})`, true)
      .write();

  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();