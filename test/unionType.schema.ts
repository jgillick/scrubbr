type SimpleTypeUnion = {
  value: OptionOne | OptionTwo;
};

type PrimitiveUnion = {
  value: string | boolean;
};

type MixedUnion = {
  value: OptionOne | null;
};

type UnionAlias = {
  value: AliasedUnion;
};

type OptionOne = {
  nodeA: string;
  nodeB: string;
};

type OptionTwo = {
  nodeA: string;
};

type AliasedUnion = OptionOne | OptionTwo;
