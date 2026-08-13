import * as core from '@actions/core';
import { bump } from './bump';

async function run(): Promise<void> {
  try {
    const currentInput = core.getInput('current-version');
    const bumpType = core.getInput('bump', { required: true }) as 'major' | 'minor' | 'patch';

    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      throw new Error(`bump: expected one of major|minor|patch, got "${bumpType}"`);
    }

    if (!currentInput) {
      throw new Error('current-version input is required');
    }

    const previousVersion = currentInput;
    const newVersion = bump(previousVersion, bumpType);

    core.setOutput('previous-version', previousVersion);
    core.setOutput('new-version', newVersion);

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