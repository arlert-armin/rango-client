import { getEnvWithFallback } from '../common/utils.mjs';
import process from 'node:process';

const scope = `@arlert-dev`;
export const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;
export const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
export const ENABLE_PREVIEW_DEPLOY = process.env.ENABLE_PREVIEW_DEPLOY;
export const EXCLUDED_PACKAGES = ['@arlert-dev/widget-iframe'];
export const ROOT_PACKAGE_NAME = 'rango-client';
export const WIDGET_APP_PACKAGE_NAME = `${scope}/widget-app`;
export const PLAYGROUND_PACKAGE_NAME = `${scope}/widget-playground`;
const QUEUE_MANAGER_PACKAGE_NAME = `${scope}/queue-manager-demo`;
const STORYBOOK_PACKAGE_NAME = `${scope}/storybook`;
export const VERCEL_PACKAGES = {
  [QUEUE_MANAGER_PACKAGE_NAME]: getEnvWithFallback('VERCEL_PROJECT_Q'),
  [PLAYGROUND_PACKAGE_NAME]: getEnvWithFallback('VERCEL_PROJECT_WIDGET_CONFIG'),
  [WIDGET_APP_PACKAGE_NAME]: getEnvWithFallback('VERCEL_PROJECT_WIDGET_APP'),
  [STORYBOOK_PACKAGE_NAME]: getEnvWithFallback('VERCEL_PROJECT_STORYBOOK'),
};
