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

  test('pass context to serializers', () => {
    const testContext = { hello: 'world' };
    scrubbr.serialize('ContextTest', data, testContext);
    expect(receivedContext.hello).toBe('world');
  });

  test('no context passes empty object', () => {
    scrubbr.serialize('ContextTest', data);
    expect(typeof receivedContext).toBe('object');
    expect(Object.keys(receivedContext).length).toBe(0);
  });

  describe('global context', () => {
    test('merge global context with passed context object', () => {
      const globalContext = { foo: 'bar' };
      const passedContext = { hello: 'world' };

      scrubbr.setGlobalContext(globalContext);
      scrubbr.serialize('ContextTest', data, passedContext);
      expect(Object.keys(receivedContext)).toEqual(['foo', 'hello']);
    });

    test('passed context overrides global context', () => {
      const globalContext = { foo: 'bar' };
      const passedContext = { foo: 'boo' };

      scrubbr.setGlobalContext(globalContext);
      scrubbr.serialize('ContextTest', data, passedContext);
      expect(Object.keys(receivedContext)).toEqual(['foo']);
      expect(receivedContext.foo).toEqual('boo');
    });

    test('global context still used if no context is passed', () => {
      const globalContext = { foo: 'bar' };

      scrubbr.setGlobalContext(globalContext);
      scrubbr.serialize('ContextTest', data);
      expect(receivedContext.foo).toEqual('bar');
    });
  });
});
