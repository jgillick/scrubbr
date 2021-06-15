type PathTest = {
  child: ChildType;
  children: ChildType[];
};

type ChildType = {
  node: string;
};

type ChildExtendedType = {
  node: string;
  extra: string;
};
