import { generateChangelogAndSave } from '../common/changelog.mjs';
import path from 'node:path';
import chalk from 'chalk';
import { should } from '../common/features.mjs';
import { addFileToStage } from '../common/git.mjs';
import { DEPLOY_COMMIT_SUBJECT } from '../common/constants.mjs';
import { execa } from 'execa';
import { GitError } from '../common/errors.mjs';
import {
  PLAYGROUND_PACKAGE_NAME,
  WIDGET_APP_PACKAGE_NAME,
} from '../deploy/config.mjs';
function rootPath() {
  return path.join('.');
}
function rootChangelogPath() {
  return path.join(rootPath(), 'CHANGELOG.md');
}
function widgetAppPackageJsonPath() {
  return path.join(rootPath(), 'widget', 'app', 'package.json');
}
function playgroundPackageJsonPath() {
  return path.join(rootPath(), 'widget', 'playground', 'package.json');
}
async function generateRootChangelog() {
  if (should('generateChangelog')) {
  console.log(`Making root changelog...`);
  await generateChangelogAndSave();
  await addFileToStage(rootChangelogPath());
  } else {
    console.log('Skipping root changelog...');
  }
}
async function commitChanges() {
  const message = `${DEPLOY_COMMIT_SUBJECT}`;
  const body = '[skip ci]';

  console.log(`Committing root changelog...`);
  // Making a deploy commit
  await execa('git', ['commit', '-m', message, '-m', body]).catch((error) => {
    throw new GitError(`git commit failed. \n ${error.stderr}`);
  });
}
async function bumpVersions() {
  const appBumpOutput = await bumpPackageVersion(WIDGET_APP_PACKAGE_NAME);
  await addFileToStage(widgetAppPackageJsonPath());
  console.log('Widget App bump output: \n', appBumpOutput);
  const playgroundBumpOutput = await bumpPackageVersion(
    PLAYGROUND_PACKAGE_NAME
  );
  await addFileToStage(playgroundPackageJsonPath());

  console.log('Playground bump output: \n', playgroundBumpOutput);
}
async function bumpPackageVersion(pkg) {
  return await execa('yarn', [
    'workspace',
    pkg,
    'version',
    `--minor`,
    '--no-git-tag-version',
    '--json',
  ]);
}
export async function versionLog() {
  if (should('generateChangelog')) {
  console.log(chalk.green('[1/3]'), `Generate root changelog`);
  await generateRootChangelog();
  console.log(chalk.green('[2/3]'), `Bump versions`);
  await bumpVersions();
  console.log(chalk.green('[3/3]'), `Commit changes`);
  await commitChanges();
  } else {
    console.log('Skipping root changelog and versioning...');
  }
}
