type User = {
  id: number;
  name: number;
};
type Post = {
  user: User;
};
type Invite = {
  guests: User[];
};
