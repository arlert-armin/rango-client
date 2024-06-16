import type { Context } from '../../hub/namespaces/mod.js';

function intoConnectionFinished() {
  return [
    'connect',
    (context: Context) => {
      const [, setState] = context.state();
      setState('connecting', false);
    },
  ] as const;
}

export const recommended = [intoConnectionFinished()];
