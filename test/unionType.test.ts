import 'jest';
import Scrubbr, { useType, ScrubbrState, LogLevel } from '../src/';

describe('Union types', () => {
  const pathTypes = new Map<string, string | null>();
  let scrubbr: Scrubbr;
  let firstSerializerFn: jest.Mock;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/unionType.schema.ts`);

    // Override this later
    firstSerializerFn = jest.fn((data: any) => data);
    scrubbr.addGenericSerializer(firstSerializerFn);

    // Track what type is chosen for ever path node
    scrubbr.addGenericSerializer((data: unknown, state: ScrubbrState) => {
      pathTypes.set(state.path, state.schemaType);
      return data;
    });
  });

  test('automatically choose between two types', async () => {
    await scrubbr.serialize('UnionTypeTestSimple', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });

    // OptionTwo has fewer properties
    expect(pathTypes.get('value')).toBe('UnionTypeTestType2');
  });

  test('choose between primitive types', async () => {
    await scrubbr.serialize('UnionTypeTestPrimitive', { value: 'test' });
    expect(pathTypes.get('value')).toBe(null);
  });

  test('union between TypeScript type and primitive', async () => {
    await scrubbr.serialize('UnionTypeTestMixed', { value: 'test' });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType1');
  });

  test('Aliased union type', async () => {
    await scrubbr.serialize('UnionTypeTestAlias', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType2');
  });

  test('Override type', async () => {
    firstSerializerFn.mockImplementation((data, state) => {
      if (state.path == 'value') {
        return useType('UnionTypeTestType1');
      }
      return data;
    });

    const output = await scrubbr.serialize('UnionTypeTestSimple', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType1');
    expect(output.value.nodeA).toBe('foo');
    expect(output.value.nodeB).toBe('bar');
  });

  // test('change type and override value', async () => {
  //   firstSerializerFn.mockImplementation((data, state) => {
  //     if (state.path == 'value') {
  //       const newNodeData = {
  //         nodeA: 'baz',
  //         nodeB: 'boo',
  //       };
  //       return useType('UnionTypeTestType1', newNodeData);
  //     }
  //     return data;
  //   });

  //   const output = await scrubbr.serialize('UnionTypeTestSimple', {
  //     value: {
  //       nodeA: 'foo',
  //       nodeB: 'bar',
  //     },
  //   });
  //   expect(pathTypes.get('value')).toBe('UnionTypeTestType1');
  //   expect(output.value.nodeA).toBe('baz');
  //   expect(output.value.nodeB).toBe('boo');
  // });
});
