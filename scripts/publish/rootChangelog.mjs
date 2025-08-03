import { generateChangelogAndSave } from '../common/changelog.mjs';
import path from 'node:path';
import { should } from '../common/features.mjs';
import { addFileToStage } from '../common/git.mjs';

export async function generateRootChangelog() {
  if (should('generateChangelog')) {
    console.log(`Making root changelog...`);
    generateChangelogAndSave();
    await addFileToStage(path.join('.', CHANGELOG.md));
  } else {
    console.log('Skipping root changelog...');
  }
}
