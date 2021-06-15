import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Path serializer', () => {
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
    scrubbr = new Scrubbr(`${__dirname}/pathSerializer.schema.ts`);
    scrubbr.addPathSerializer(serializerFn);
  });

  test('call serializer for every node of the object', async () => {
    const paths: string[] = [];
    serializerFn.mockImplementation((data, state) => {
      paths.push(state.path);
      return data;
    });

    const serialized = await scrubbr.serialize(data, 'PathTest');

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

  test('pass context to path serializers', async () => {
    const context = { foo: 'bar' };

    // Check that the context is passed to each node of the path
    let contextReceived: boolean | null = null;
    serializerFn.mockImplementation((data, state) => {
      if (contextReceived === false) {
        return;
      }
      if (state.context != context) {
        throw new Error(
          `${JSON.stringify(state.context)} does not match ${JSON.stringify(
            context
          )}`
        );
      }
      return data;
    });

    await scrubbr.serialize(data, 'PathTest', context);
  });

  test('modify node', async () => {
    serializerFn.mockImplementation((data, state) => {
      if (state.path == 'child.node') {
        return 'Changed!';
      }
      return data;
    });

    const serialized = await scrubbr.serialize(data, 'PathTest');
    expect(serialized.child.node).toBe('Changed!');
  });

  test('remove part of the tree', async () => {
    const paths: string[] = [];
    serializerFn.mockImplementation((data, state) => {
      paths.push(state.path);
      if (state.path == 'children') {
        return [];
      }
      return data;
    });

    await scrubbr.serialize(data, 'PathTest');
    expect(paths).toEqual(['', 'child', 'child.node', 'children']);
  });

  test('override node type', async () => {
    serializerFn.mockImplementation((data, state) => {
      if (state.path == 'child') {
        return useType('ChildExtendedType');
      }
      return data;
    });

    const serialized = await scrubbr.serialize(data, 'PathTest');
    expect(serialized.child.extra).toBe('bar');
  });
});
