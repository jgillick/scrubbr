import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Type serializers', () => {
  let scrubbr: Scrubbr;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/typeSerializer.schema.ts`);
  });

  test('call serializer for each matching type', async () => {
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
    await scrubbr.serialize(data, 'TypeSerializerTest');

    expect(serializerFn).toHaveBeenCalledTimes(3);
    expect(values).toEqual(expect.arrayContaining(['foo', 'baz', 'boo']));
  });

  test('override type', async () => {
    const typeBSerializerFn = jest.fn((data, _state) => data);

    scrubbr.addTypeSerializer('TargetTypeA', () => useType('TargetTypeB'));
    scrubbr.addTypeSerializer('TargetTypeB', typeBSerializerFn);

    const data = {
      node: { value: 'foo' }, // TargetTypeA
      child: [{ node: { value: 'baz' } }, { node: { value: 'boo' } }], // TargetTypeA[]
      other: { value: 'nope' }, // TargetTypeB
    };
    await scrubbr.serialize(data, 'TypeSerializerTest');
    expect(typeBSerializerFn).toHaveBeenCalledTimes(4);
  });

  test('union type', async () => {
    const typeASerializerFn = jest.fn((data, _state) => data);
    const typeBSerializerFn = jest.fn((data, _state) => data);

    scrubbr.addTypeSerializer('TargetTypeA', typeASerializerFn);
    scrubbr.addTypeSerializer('TargetTypeB', typeBSerializerFn);

    const data = {
      node: { value: 'foo' }, // TargetTypeA | TargetTypeB
    };
    await scrubbr.serialize(data, 'TypeSerializerUnionTest');
    expect(typeASerializerFn).toHaveBeenCalledTimes(0);
    expect(typeBSerializerFn).toHaveBeenCalledTimes(1);
  });
});
