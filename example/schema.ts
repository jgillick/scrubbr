type PostList = {
  posts: Post[];
};

type Post = {
  title: string;
  body: string;
  image: string;
  createdAt: Date;
  author: UserPublic;
  comments: PostComment[];
};

type PostComment = {
  message: string;
  createdAt: Date;
  user: UserPublic;
};

type UserPublic = {
  id: string;
  name: string;
  // Don't include email and lastLogin in our public API
};

type UserPrivileged = UserPublic & {
  email: string;
  lastLogin: string;
};
