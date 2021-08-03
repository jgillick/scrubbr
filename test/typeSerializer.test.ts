import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Type serializers', () => {
  let scrubbr: Scrubbr;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/typeSerializer.schema.ts`);
  });

  test('call serializer for each matching type', () => {
    const values: string[] = [];
    const serializerFn = jest.fn((data, _state) => {
      values.push(data.value);
      return values;
    });

    scrubbr.addTypeSerializer('TargetTypeA', serializerFn);
    const data = {
      node: { value: 'foo' }, // TargetTypeA
      child: [{ node: { value: 'baz' } }, { node: { value: 'boo' } }], // TargetTypeA[]
      other: { value: 'nope' }, // TargetTypeB
    };
    scrubbr.serialize('TypeSerializerTest', data);

    expect(serializerFn).toHaveBeenCalledTimes(3);
    expect(values).toEqual(expect.arrayContaining(['foo', 'baz', 'boo']));
  });

  test('override type', () => {
    const typeBSerializerFn = jest.fn((data, _state) => data);

    scrubbr.addTypeSerializer('TargetTypeA', () => useType('TargetTypeB'));
    scrubbr.addTypeSerializer('TargetTypeB', typeBSerializerFn);

    const data = {
      node: { value: 'foo' }, // TargetTypeA
      child: [{ node: { value: 'baz' } }, { node: { value: 'boo' } }], // TargetTypeA[]
      other: { value: 'nope' }, // TargetTypeB
    };
    scrubbr.serialize('TypeSerializerTest', data);
    expect(typeBSerializerFn).toHaveBeenCalledTimes(4);
  });

  test('override type and transform node', () => {
    scrubbr.addTypeSerializer('TargetTypeA', () => {
      const newData = {
        value: 'boo',
      };
      return useType('TargetTypeB', newData);
    });

    const data = {
      node: { value: 'foo' },
    };
    const serialized = scrubbr.serialize('TypeSerializerTest', data);
    expect(serialized.node.value).toBe('boo');
  });

  test('union type', () => {
    const typeASerializerFn = jest.fn((data, _state) => data);
    const typeBSerializerFn = jest.fn((data, _state) => data);

    scrubbr.addTypeSerializer('TargetTypeA', typeASerializerFn);
    scrubbr.addTypeSerializer('TargetTypeB', typeBSerializerFn);

    const data = {
      node: { value: 'foo' }, // TargetTypeA | TargetTypeB
    };
    scrubbr.serialize('TypeSerializerUnionTest', data);
    expect(typeASerializerFn).toHaveBeenCalledTimes(0);
    expect(typeBSerializerFn).toHaveBeenCalledTimes(1);
  });

  test('add multiple types to a single serializer', () => {
    let receivedTypes = new Set<string>();

    const serializerFn = jest.fn((data, state) => {
      receivedTypes.add(state.schemaType);
      return data;
    });

    const data = {
      node: {
        id: 'bar',
        value: 'boo',
      },
      other: { value: 'foo' },
    };

    scrubbr.addTypeSerializer(['TargetTypeA', 'TargetTypeB'], serializerFn);
    scrubbr.serialize('TypeSerializerTest', data, {});

    expect(serializerFn).toHaveBeenCalledTimes(2);
    expect(Array.from(receivedTypes)).toEqual(['TargetTypeA', 'TargetTypeB']);
  });
});
