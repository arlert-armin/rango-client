import { execa } from 'execa';
import { generateChangelog } from './changelog.mjs';
import {
  GithubCommandError,
  GithubCreateReleaseFailedError,
  GithubGetReleaseError,
  GithubReleaseNotFoundError,
} from './errors.mjs';
import { should } from './features.mjs';
import { generateTagName, getEnvWithFallback } from './utils.mjs';

/**
 *
 * @param {import("./typedefs.mjs").Package} pkg
 * @returns {Promise<import("./typedefs.mjs").Release>}
 *
 */
export async function getGithubReleaseFor(pkg) {
  const tag = generateTagName(pkg);

  const result = await execa('gh', [
    'release',
    'view',
    tag,
    '--json',
    'tagName',
  ]).catch((err) => {
    if (err.stderr === 'release not found') {
      throw new GithubReleaseNotFoundError(tag);
    }
    throw new GithubGetReleaseError(err.message);
  });

  const release = JSON.parse(result.stdout);

  return release;
}

/**
 * Generate changelog for a package and making a release on Github.
 * @param {import('./typedefs.mjs').Package} pkg
 */
export async function makeGithubRelease(pkg) {
  const notes = '';
  for await (chunk of generateChangelog(pkg)) {
    notes += chunk;
  }

  const tagName = generateTagName(pkg);
  const output = await execa('gh', [
    'release',
    'create',
    tagName,
    '--target',
    'main',
    '--notes',
    notes,
    '--verify-tag',
  ])
    .then(({ stdout }) => stdout)
    .catch((err) => {
      throw new GithubCreateReleaseFailedError(err.stdout);
    });

  return output;
}

/**
 * Get a package and try to get a github release with same (tag) name.
 * Returns null if any release not found.
 *
 * @param {import('./typedefs.mjs').Package} pkg
 * @returns {Promise<string | null>}
 */
export async function githubReleaseFor(pkg) {
  try {
    const release = await getGithubReleaseFor(pkg);
    return release.tagName;
  } catch (err) {
    if (err instanceof GithubReleaseNotFoundError) {
      return null;
    }

    throw err;
  }
}

/**
 *
 * @param {PullRequestInfo} pr
 *
 * @typedef {Object} PullRequestInfo
 * @property {string} title PR title
 * @property {string} branch your current branch
 * @property {string} baseBranch PR will be merge into base branch.
 * @property {string} templatePath template path for PR
 *
 */
export async function createPullRequest(pr) {
  const { title, baseBranch, branch, templatePath } = pr;

  if (!title || !baseBranch || !branch || !templatePath) {
    throw new GithubCommandError(
      'Creating pull request can not be proceed without required parameters. \n',
      JSON.stringify({ title, baseBranch, branch, templatePath })
    );
  }

  const ghCreateParams = [
    '--title',
    title,
    '--base',
    baseBranch,
    '--head',
    branch,
    '--body-file',
    templatePath,
  ];
  const output = await execa('gh', ['pr', 'create', ...ghCreateParams])
    .then(({ stdout }) => stdout)
    .catch((err) => {
      throw new GithubCommandError(
        `gh pr command failed. \n ${err.stdout || err} \n`
      );
    });

  return output;
}

export async function createComment(comment) {
  const {commentBody, issueNumber} = comment;

  if (!issueNumber || !commentBody) {
    throw new GithubCommandError(
      'Creating comment cannot proceed without required parameters. \n',
      JSON.stringify({ issueNumber, commentBody })
    );
  }

    const output = await execa('gh', ['issue', 'comment', issueNumber, '--body', commentBody])
    .then(({ stdout }) => stdout)
    .catch((err) => {
      throw new GithubCommandError(
        `Failed to add comment to issue. \n ${err.stdout || err} \n`
      );
    });

    return output;
}

export function checkEnvironments() {
  const envs = {
    NPM_TOKEN: !!process.env.NPM_TOKEN,
    REF: !!process.env.REF,
    GH_TOKEN: !!process.env.GH_TOKEN,
    VERCEL_ORG_ID: !!process.env.VERCEL_ORG_ID,
    VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
    VERCEL_PROJECT_Q: !!process.env.VERCEL_PROJECT_Q,
    VERCEL_PROJECT_WIDGET_CONFIG: !!process.env.VERCEL_PROJECT_WIDGET_CONFIG,
    VERCEL_PROJECT_WIDGET_APP: !!process.env.VERCEL_PROJECT_WIDGET_APP,
    VERCEL_PROJECT_STORYBOOK: !!process.env.VERCEL_PROJECT_STORYBOOK,
  };

  const features = [
    { name: 'check github release', value: should('checkGithubRelease') },
    { name: 'check git tags', value: should('checkGitTags') },
    { name: 'check versions on npm', value: should('checkNpm') },
  ];

  console.log('Environments Variables:');
  console.table(envs);
  console.log('Features:');
  console.table(features);
}

export function detectChannel() {
  if (getEnvWithFallback('REF') === 'refs/heads/main') {
    return 'prod';
  }
  return 'next';
}
