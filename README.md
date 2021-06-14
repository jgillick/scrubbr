# Scrubbr

Serialize and sanitize your JSON data using TypeScript or JSON Schema.

## Why

When sending data from your webserver to the client, you don't want to send ALL the data that was fetched from your data source. It could contain sensitive information, or you might want to transform it to a difference format that easier for the client to process. Doing this manually can be a lot of work and leaves your data open to dangerous edge cases.

If you're already using TypeScript, you can define what the data _should_ look like, and Scrubbr will translate it automatically. You can also define custom serializers that will be used for particular TypeScript types, anywhere they're encountered in your data.

## Quickstart

Define a TypeScript file as the master schema, and then use it to serialize your data:

```typescript
import Scrubbr from "scrubbr";

// Performance note: this is a synchronous file load. Load early and cache to a shared variable.
const scrubbr = new Scrubbr("./schema.ts");

async function api() {
  const data = await dataService.getPosts();

  // Serialize the data based on the PostList type defined in schema.ts
  return await scrubbr.serialize(data, "PostList");
}
```

## Full Example

Let's say we have a blog with posts and comments. The user objects returned should not contain sensitive information like their email address or last time they logged in.

Here's the raw data:

```js
{
  "posts": [
    {
      "title": "Pineapple on pizza",
      "body": "How do people feel about pineapple on pizza?",
      "user": {
        "id": 1,
        "name": "Bobby Troller",
        "email": "troll@example.com",
        "lastLogin": "2021-06-01T00:11:00.000Z"
      },
      "comments": [
        {
          "message": "I'm offended you would even ask!",
          "createdAt": "2021-06-11T00:12:58.134Z",
          "user": {
            "id": 1,
            "name": "Johnny Walker",
            "email": "spam@example.com",
            "lastLogin": "2021-06-11T00:12:58.134Z"
          }
        },
        {
          "message": "It's my favorite topping and I will fight anyone who disagrees.",
          "createdAt": "2021-06-11T00:14:00.000Z",
          "user": {
            "id": 2,
            "name": "Mary Lou",
            "email": "mary@example.com",
            "lastLogin": "2021-06-11T00:14:00.000Z"
          }
        }
      ]
    }
  ]
}
```

The TypeScript for the data schema would look like this (notice how `User` does not include `email` or `lastLogin`):

```Typescript
export type PostList = {
  posts: Post[];
};
export type Post = {
  title: string;
  body: string;
  user: User;
};
export type Comment = {
  message: string;
  createdAt: Date;
  user: User;
};
export type User = {
  id: number;
  name: number;
};
```

Now let's scrub the data

```typescript
import Scrubbr from 'scrubbr';

const scrubbr = Scrubbr('./schema.ts');

async function api() {
  const data = {...} // see above example
  return await scrubbr.serialize(data, 'PostList');
}
```

The returned data would look like this:

```json
{
  "posts": [
    {
      "title": "Pineapple on pizza",
      "body": "How do people feel about pineapple on pizza?",
      "user": {
        "id": 1,
        "name": "Bobby Troller"
      },
      "comments": [
        {
          "message": "I'm offended you would even ask!",
          "createdAt": "2021-06-11T00:12:58.134Z",
          "user": {
            "id": 1,
            "name": "Johnny Walker"
          }
        },
        {
          "message": "It's my favorite topping and I will fight anyone who disagrees.",
          "createdAt": "2021-06-11T00:14:00.000Z",
          "user": {
            "id": 2,
            "name": "Mary Lou"
          }
        }
      ]
    }
  ]
}
```
