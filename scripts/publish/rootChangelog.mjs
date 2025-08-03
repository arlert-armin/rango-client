import { generateChangelogAndSave } from '../common/changelog.mjs';
import path from 'node:path';
import { should } from '../common/features.mjs';
import { addFileToStage } from '../common/git.mjs';
import { DEPLOY_COMMIT_SUBJECT } from '../common/constants.mjs';
import { execa } from 'execa';
import { GitError } from '../common/errors.mjs';

export async function generateRootChangelog() {
  if (should('generateChangelog')) {
    console.log(`Making root changelog...`);
    generateChangelogAndSave();
    await addFileToStage(path.join('.', 'CHANGELOG.md'));
    const message = `${DEPLOY_COMMIT_SUBJECT}`;
    const body = '[skip ci]';

    console.log(`Committing root changelog...`);
    // Making a deploy commit
    await execa('git', ['commit', '-m', message, '-m', body]).catch((error) => {
      throw new GitError(`git commit failed. \n ${error.stderr}`);
    });
  } else {
    console.log('Skipping root changelog...');
  }
}
