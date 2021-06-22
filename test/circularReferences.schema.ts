// TypeScript prevents explicit circular references,
// but we can accidentally create one with Type Serializer functions

type CircularReferenceTest1 = {
  value: CircularReferenceTestType1;
};

type CircularReferenceTestType1 = string;
type CircularReferenceTestType2 = string;
