type TypeSerializerTest = {
  node: TargetTypeA;
  child: SubType[];
  other: TargetTypeB;
};

type TypeSerializerUnionTest = {
  node: TargetTypeA | TargetTypeB;
};

type SubType = {
  node: TargetTypeA;
};

type TargetTypeA = {
  id: string;
  value: string;
};

type TargetTypeB = {
  value: string;
};
