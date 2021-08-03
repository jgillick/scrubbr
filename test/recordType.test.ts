import 'jest';
import Scrubbr, { LogLevel } from '../src/';

const scrubbr = new Scrubbr(`${__dirname}/recordType.schema.ts`, {
  logLevel: LogLevel.DEBUG,
});

describe('<Record>', () => {
  test('return all matching properties', async () => {
    const data = {
      value: {
        foo: 'bar',
        baz: 123,
        123: 345,
      },
    };
    const serialized = await scrubbr.serialize('RecordTest', data);
    expect(serialized.value).toBeDefined();
    expect(serialized.value).toEqual(
      expect.objectContaining({
        foo: 'bar',
        baz: 123,
      })
    );
  });
});
