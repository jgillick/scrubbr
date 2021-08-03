import 'jest';
import Scrubbr from '../src/';

const scrubbr = new Scrubbr(`${__dirname}/tuples.schema.ts`);

describe('Tuples', () => {
  test('convert tuple to array', () => {
    const data = {
      value: ['string', 123, false],
    };
    const serialized = scrubbr.serialize('TupleTest', data);
    expect(serialized.value.length).toBe(3);
    expect(serialized.value).toEqual(['string', 123, false]);
  });

  test('enforce max length', () => {
    const data = {
      value: ['string', 123, false, 'extra item'],
    };
    const serialized = scrubbr.serialize('TupleTest', data);
    expect(serialized.value.length).toEqual(3);
    expect(serialized.value).toEqual(['string', 123, false]);
  });

  test('follow type references', () => {
    const data = {
      value: [
        {
          name: 'foo',
          id: 'boo',
        },
      ],
    };
    const serialized = scrubbr.serialize('TypleTypeReference', data);
    expect(serialized.value.length).toEqual(1);
    expect(serialized.value[0].name).toBe('foo');
    expect(serialized.value[0].id).toBeUndefined();
  });
});
