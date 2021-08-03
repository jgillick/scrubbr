import 'jest';
import Scrubbr from '../src/';

const scrubbr = new Scrubbr(`${__dirname}/extraProps.schema.ts`);

describe('do not serialize properties not in schema', () => {
  test('root object', () => {
    const data = {
      value1: 1,
      value2: 'foo',
      extraValue: 'foo@boo.com',
    };
    const serialized = scrubbr.serialize('ExtraPropsTest', data);
    expect(serialized).toEqual(
      expect.objectContaining({ value1: 1, value2: 'foo' })
    );
    expect(serialized.extraValue).toBeUndefined();
  });

  test('child object', () => {
    const data = {
      child: {
        value1: 1,
        value2: 'foo',
        extraValue: 'foo@boo.com',
      },
    };
    const serialized = scrubbr.serialize('ExtraPropsChildTest', data);
    expect(serialized.child).toEqual(
      expect.objectContaining({ value1: 1, value2: 'foo' })
    );
    expect(serialized.child.extraValue).toBeUndefined();
  });

  test('as array item', () => {
    const data = {
      list: [
        {
          value1: 1,
          value2: 'foo',
          extraValue: 'foo@boo.com',
        },
        {
          value1: 2,
          value2: 'bar',
          extraValue: 'hello@world.com',
        },
      ],
    };
    const serialized = scrubbr.serialize('ExtraPropsArrayTest', data);
    expect(serialized.list[0]).toEqual(
      expect.objectContaining({ value1: 1, value2: 'foo' })
    );
    expect(serialized.list[1]).toEqual(
      expect.objectContaining({ value1: 2, value2: 'bar' })
    );
    expect(serialized.list[0].extraValue).toBeUndefined();
    expect(serialized.list[1].extraValue).toBeUndefined();
  });
});
