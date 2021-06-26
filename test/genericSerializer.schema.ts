type GenericSerializerTest = {
  child: GenericSerializerChildType;
  children: GenericSerializerChildType[];
};

type GenericSerializerChildType = {
  node: string;
};

type GenericSerializerExtended = {
  node: string;
  extra: string;
};
