import 'jest';
import Scrubbr, { useType, ScrubbrState } from '../src/';

describe('Union types', () => {
  let scrubbr: Scrubbr;
  let pathTypes = new Map<string, string | null>();
  let firstSerializerFn: jest.Mock;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/unionType.schema.ts`);

    // Track what type is chosen for ever path node
    firstSerializerFn = jest.fn((data: any, _state: ScrubbrState) => data);
    scrubbr.addGenericSerializer(firstSerializerFn);
    scrubbr.addGenericSerializer((data: any, state: ScrubbrState) => {
      pathTypes.set(state.path, state.schemaType);
      return data;
    });
  });

  test('automatically choose between two types', async () => {
    await scrubbr.serialize('SimpleTypeUnion', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });

    // OptionTwo has fewer properties
    expect(pathTypes.get('value')).toBe('OptionTwo');
  });

  test('choose between primitive types', async () => {
    await scrubbr.serialize('PrimitiveUnion', { value: 'test' });
    expect(pathTypes.get('value')).toBe(null);
  });

  test('union between TypeScript type and primitive', async () => {
    await scrubbr.serialize('MixedUnion', { value: 'test' });
    expect(pathTypes.get('value')).toBe('OptionOne');
  });

  test('Aliased union type', async () => {
    await scrubbr.serialize('UnionAlias', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('OptionTwo');
  });

  test('Override type', async () => {
    firstSerializerFn.mockImplementation((data, state) => {
      if (state.path == 'value') {
        return useType('OptionOne');
      }
      return data;
    });
    const output = await scrubbr.serialize('SimpleTypeUnion', {
      value: {
        nodeA: 'foo',
        nodeB: 'bar',
      },
    });
    expect(pathTypes.get('value')).toBe('OptionOne');
    expect(output.value.nodeA).toBe('foo');
    expect(output.value.nodeB).toBe('bar');
  });
});
