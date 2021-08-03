import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Generic serializer', () => {
  let serializerFn: jest.Mock;
  let scrubbr: Scrubbr;

  const data = {
    child: {
      node: 'foo',
      extra: 'bar',
    },
    children: [{ node: 'child1' }, { node: 'child2' }],
  };

  beforeEach(() => {
    serializerFn = jest.fn((data, _state) => data);
    scrubbr = new Scrubbr(`${__dirname}/genericSerializer.schema.ts`);
    scrubbr.addGenericSerializer(serializerFn);
  });

  test('call serializer for every node of the object', () => {
    const paths: string[] = [];
    serializerFn.mockImplementation((data, state) => {
      paths.push(state.path);
      return data;
    });

    const serialized = scrubbr.serialize('GenericSerializerTest', data);

    expect(serializerFn).toBeCalled();
    expect(paths).toEqual([
      '',
      'child',
      'child.node',
      'children',
      'children[0]',
      'children[0].node',
      'children[1]',
      'children[1].node',
    ]);
    expect(serialized.child.extra).toBeUndefined();
  });

  test('pass context to generic serializers', () => {
    const context = { foo: 'bar' };

    // Check that the context is passed to each node
    let contextReceived: boolean | null = null;
    serializerFn.mockImplementation((data, state) => {
      if (contextReceived === false) {
        return;
      }
      if (state.context.foo != context.foo) {
        throw new Error(
          `${JSON.stringify(state.context)} does not match ${JSON.stringify(
            context
          )}`
        );
      }
      return data;
    });

    scrubbr.serialize('GenericSerializerTest', data, context);
  });

  test('modify node', () => {
    serializerFn.mockImplementation((data, state) => {
      if (state.path == 'child.node') {
        return 'Changed!';
      }
      return data;
    });

    const serialized = scrubbr.serialize('GenericSerializerTest', data);
    expect(serialized.child.node).toBe('Changed!');
  });

  test('remove part of the tree', () => {
    const paths: string[] = [];
    serializerFn.mockImplementation((data, state) => {
      paths.push(state.path);
      if (state.path == 'children') {
        return [];
      }
      return data;
    });

    scrubbr.serialize('GenericSerializerTest', data);
    expect(paths).toEqual(['', 'child', 'child.node', 'children']);
  });

  test('override node type', () => {
    serializerFn.mockImplementation((data, state) => {
      if (state.path == 'child') {
        return useType('GenericSerializerExtended');
      }
      return data;
    });

    const serialized = scrubbr.serialize('GenericSerializerTest', data);
    expect(serialized.child.extra).toBe('bar');
  });

  test('override type and transform node', () => {
    serializerFn.mockImplementation((data, state) => {
      if (state.path == 'child') {
        const newData = {
          node: 'boo',
          extra: 'woo',
        };
        return useType('GenericSerializerExtended', newData);
      }
      return data;
    });

    const serialized = scrubbr.serialize('GenericSerializerTest', {
      child: {
        node: 'foo',
        extra: 'bar',
      },
    });
    expect(serialized.child.node).toBe('boo');
    expect(serialized.child.extra).toBe('woo');
  });
});
