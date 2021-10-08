export type UnionTypeTestSimple = {
  value: UnionTypeTestType1 | UnionTypeTestType2;
};

export type UnionTypeTestPrimitive = {
  value: string | boolean;
};

export type UnionTypeTestMixed = {
  value: UnionTypeTestType1 | null;
};

export type UnionTypeTestAlias = {
  value: AliasedUnion;
};

export type UnionTypeSingularAndArray = {
  value: UnionTypeTestType1 | UnionTypeTestType2[];
};

export type UnionTypeArrayAndNull = {
  value: UnionTypeTestType2[] | null;
};

type UnionTypeTestType1 = {
  nodeA: string;
  nodeB: string;
};

type UnionTypeTestType2 = {
  nodeA: string;
};

type AliasedUnion = UnionTypeTestType1 | UnionTypeTestType2;
