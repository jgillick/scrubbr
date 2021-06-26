import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Context', () => {
  let scrubbr: Scrubbr;
  let receivedContext: any;

  const data = {
    value: 'bar',
  };

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/context.schema.ts`);
    scrubbr.addGenericSerializer((_data, state) => {
      receivedContext = state.context;
    });
  });

  test('pass context to serializers', async () => {
    const testContext = { hello: 'world' };
    await scrubbr.serialize('ContextTest', data, testContext);
    expect(receivedContext.hello).toBe('world');
  });

  test('no context passes empty object', async () => {
    await scrubbr.serialize('ContextTest', data);
    expect(typeof receivedContext).toBe('object');
    expect(Object.keys(receivedContext).length).toBe(0);
  });

  describe('global context', () => {
    test('merge global context with passed context object', async () => {
      const globalContext = { foo: 'bar' };
      const passedContext = { hello: 'world' };

      scrubbr.setGlobalContext(globalContext);
      await scrubbr.serialize('ContextTest', data, passedContext);
      expect(Object.keys(receivedContext)).toEqual(['foo', 'hello']);
    });

    test('passed context overrides global context', async () => {
      const globalContext = { foo: 'bar' };
      const passedContext = { foo: 'boo' };

      scrubbr.setGlobalContext(globalContext);
      await scrubbr.serialize('ContextTest', data, passedContext);
      expect(Object.keys(receivedContext)).toEqual(['foo']);
      expect(receivedContext.foo).toEqual('boo');
    });

    test('global context still used if no context is passed', async () => {
      const globalContext = { foo: 'bar' };

      scrubbr.setGlobalContext(globalContext);
      await scrubbr.serialize('ContextTest', data);
      expect(receivedContext.foo).toEqual('bar');
    });
  });
});
