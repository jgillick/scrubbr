type ExtraPropsTest = {
  value1: number;
  value2: string;
};

type ExtraPropsChildTest = {
  child: ExtraPropsTest;
};

type ExtraPropsArrayTest = {
  list: ExtraPropsTest[];
};
