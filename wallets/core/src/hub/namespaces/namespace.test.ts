import { describe, expect, test, vi } from 'vitest';

import { NamespaceBuilder } from '../../builders/namespace.js';

describe('check NamespaceBuilder works as expected', () => {
  const NAMESPACE = 'bip122';
  const PROVIDER_ID = 'garbage provider';

  test('add actions and run them.', () => {
    const builder = new NamespaceBuilder<{
      hello: () => void;
      bye: () => void;
      chainable: () => void;
      chain2: () => void;
    }>(NAMESPACE, PROVIDER_ID);
    builder.action('hello', () => 'hello world');
    builder.action('bye', () => 'bye bye');
    builder
      .action('chainable', () => "it's also chainable")
      .action('chain2', () => 'chain2');
    const blockchain = builder.build();

    expect(blockchain.hello()).toBe('hello world');
    expect(blockchain.bye()).toBe('bye bye');

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      return blockchain.some_action_name_that_has_not_added();
    }).toThrowError();
  });

  test('call .init only once.', () => {
    const builder = new NamespaceBuilder<any>(NAMESPACE, PROVIDER_ID);
    let count = 0;
    builder.action('init', () => {
      count++;
    });
    const blockchain = builder.build();
    blockchain.init();
    blockchain.init();

    expect(count).toBe(1);
  });

  test('after and before should be called before target action', () => {
    const before = vi.fn();
    const after = vi.fn();
    const connectAction = vi.fn();
    const disconnectAction = vi.fn();
    const builder = new NamespaceBuilder<{
      connect: () => void;
      disconnect: () => void;
    }>(NAMESPACE, PROVIDER_ID);
    builder.action('connect', connectAction);
    builder.action('disconnect', disconnectAction);
    const blockchain = builder.build();

    blockchain.connect();
    expect(connectAction).toBeCalledTimes(1);
    expect(before).toBeCalledTimes(0);
    expect(after).toBeCalledTimes(0);

    blockchain.before('connect', before);
    blockchain.connect();
    expect(connectAction).toBeCalledTimes(2);
    expect(before).toBeCalledTimes(1);
    expect(after).toBeCalledTimes(0);

    blockchain.after('connect', after);
    blockchain.connect();
    expect(before).toBeCalledTimes(2);
    expect(after).toBeCalledTimes(1);
  });
});
