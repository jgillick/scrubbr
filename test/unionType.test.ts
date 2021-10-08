import 'jest';
import Scrubbr, { useType, ScrubbrState, LogLevel } from '../src/';

describe('Union types', () => {
  const pathTypes = new Map<string, string | null>();
  let scrubbr: Scrubbr;
  let firstSerializerFn: jest.Mock;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/unionType.schema.ts`, {
      logLevel: LogLevel.INFO,
    });

    // Override this later
    firstSerializerFn = jest.fn((data: any) => data);
    scrubbr.addGenericSerializer(firstSerializerFn);

    // Track what type is chosen for ever path node
    scrubbr.addGenericSerializer((data: unknown, state: ScrubbrState) => {
      pathTypes.set(state.path, state.schemaType);
      return data;
    });
  });

  test('automatically choose between two types', () => {
    scrubbr.serialize('UnionTypeTestSimple', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });

    // OptionTwo has fewer properties
    expect(pathTypes.get('value')).toBe('UnionTypeTestType2');
  });

  test('choose between primitive types', () => {
    scrubbr.serialize('UnionTypeTestPrimitive', { value: 'test' });
    expect(pathTypes.get('value')).toBe(null);
  });

  test('union between TypeScript type and primitive', () => {
    scrubbr.serialize('UnionTypeTestMixed', { value: 'test' });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType1');
  });

  test('Aliased union type', () => {
    scrubbr.serialize('UnionTypeTestAlias', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType2');
  });

  test('Override type', () => {
    firstSerializerFn.mockImplementation((data, state) => {
      if (state.path == 'value') {
        return useType('UnionTypeTestType1');
      }
      return data;
    });

    const output = scrubbr.serialize('UnionTypeTestSimple', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('UnionTypeTestType1');
    expect(output.value.nodeA).toBe('foo');
    expect(output.value.nodeB).toBe('bar');
  });

  describe('singular and array', () => {
    test('with array value', () => {
      const serialized = scrubbr.serialize('UnionTypeSingularAndArray', {
        value: [{ nodeA: 'foo' }, { nodeA: 'bar' }],
      });

      expect(serialized.value.length).toBe(2);
      expect(serialized.value[0].nodeA).toBe('foo');
      expect(serialized.value[1].nodeA).toBe('bar');
    });

    test('with singular value', () => {
      const serialized = scrubbr.serialize('UnionTypeSingularAndArray', {
        value: { nodeA: 'foo', nodeB: 'bar' },
      });

      expect(Array.isArray(serialized.value)).toBe(false);
      expect(serialized.value.nodeA).toBe('foo');
      expect(serialized.value.nodeB).toBe('bar');
    });
  });

  describe('array and null', () => {
    test('array value', () => {
      const serialized = scrubbr.serialize('UnionTypeArrayAndNull', {
        value: [{ nodeA: 'foo' }, { nodeA: 'bar' }],
      });

      expect(serialized.value.length).toBe(2);
      expect(serialized.value[0].nodeA).toBe('foo');
      expect(serialized.value[1].nodeA).toBe('bar');
    });

    test('null value', () => {
      const serialized = scrubbr.serialize('UnionTypeArrayAndNull', {
        value: null,
      });

      expect(serialized.value).toBe(null);
    });
  });

  // test('change type and override value', () => {
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

  //   const output = scrubbr.serialize('UnionTypeTestSimple', {
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
