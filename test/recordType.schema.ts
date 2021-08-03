type PossibleKeys = 'foo' | 'baz';

type RecordTest = {
  value: Record<PossibleKeys, number>;
};
