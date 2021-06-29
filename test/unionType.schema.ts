type UnionTypeTestSimple = {
  value: UnionTypeTestType1 | UnionTypeTestType2;
};

type UnionTypeTestPrimitive = {
  value: string | boolean;
};

type UnionTypeTestMixed = {
  value: UnionTypeTestType1 | null;
};

type UnionTypeTestAlias = {
  value: AliasedUnion;
};

type UnionTypeTestType1 = {
  nodeA: string;
  nodeB: string;
};

type UnionTypeTestType2 = {
  nodeA: string;
};

type AliasedUnion = UnionTypeTestType1 | UnionTypeTestType2;
