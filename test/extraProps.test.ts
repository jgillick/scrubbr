import 'jest';
import Scrubbr from '../src/';

const scrubbr = new Scrubbr(`${__dirname}/extraProps.schema.ts`);

describe('do not serialize properties not in schema', () => {
  test('root object', async () => {
    const data = {
      id: 1,
      name: 'foo',
      email: 'foo@boo.com',
    };
    const serialized = await scrubbr.serialize('User', data);
    expect(serialized).toEqual(expect.objectContaining({ id: 1, name: 'foo' }));
    expect(serialized.email).toBeUndefined();
  });

  test('child object', async () => {
    const data = {
      user: {
        id: 1,
        name: 'foo',
        email: 'foo@boo.com',
      },
    };
    const serialized = await scrubbr.serialize('Post', data);
    expect(serialized.user).toEqual(
      expect.objectContaining({ id: 1, name: 'foo' })
    );
    expect(serialized.user.email).toBeUndefined();
  });

  test('as array item', async () => {
    const data = {
      guests: [
        {
          id: 1,
          name: 'foo',
          email: 'foo@boo.com',
        },
      ],
    };
    const serialized = await scrubbr.serialize('Invite', data);
    expect(serialized.guests[0]).toEqual(
      expect.objectContaining({ id: 1, name: 'foo' })
    );
    expect(serialized.guests[0].email).toBeUndefined();
  });
});
