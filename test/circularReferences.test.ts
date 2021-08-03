import 'jest';
import Scrubbr, { useType } from '../src/';

describe('Circular references', () => {
  let scrubbr: Scrubbr;

  beforeEach(() => {
    scrubbr = new Scrubbr(`${__dirname}/circularReferences.schema.ts`);
  });

  test('type serializers referencing each other', async () => {
    let loop = 0;
    scrubbr.addTypeSerializer('CircularReferenceTestType1', () => {
      // On the third loop, fail
      if (loop) {
        throw new Error('Infinite loop detected');
      }

      loop++;
      return useType('CircularReferenceTestType2');
    });
    scrubbr.addTypeSerializer('CircularReferenceTestType2', () => {
      return useType('CircularReferenceTestType1');
    });

    const data = { value: 'test' };
    return expect(() =>
      scrubbr.serialize('CircularReferenceTest1', data)
    ).toThrowError();
  }, 500);
});
