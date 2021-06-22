type PathSerializerTest = {
  child: PathSerializerChildType;
  children: PathSerializerChildType[];
};

type PathSerializerChildType = {
  node: string;
};

type PathSerializerExtended = {
  node: string;
  extra: string;
};
