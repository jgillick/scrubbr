# Scrubbr

[![Tests](https://github.com/jgillick/scrubbr/actions/workflows/test.yml/badge.svg)](https://github.com/jgillick/scrubbr/actions)
[![npm version](https://img.shields.io/npm/v/scrubbr)](https://badge.fury.io/js/scrubbr)

<!-- [![downloads](https://img.shields.io/npm/dm/Scrubbr)](https://www.npmjs.com/package/scrubbr) -->

Serialize and sanitize JSON API data using your TypeScript as the schema.

![Simple Example](https://github.com/jgillick/scrubbr/raw/main/example.png)

Serializing and sanitizing data sent from the webserver to the client shouldn't be hard. If you're already using TypeScript, you have everything you need. Scrubbr will use your TypeScript types to deeply transform and sanitize your data.

## Install

```shell
npm i -S scrubbr
```

## Quickstart

1. Define a TypeScript file as your master schema:

```typescript
// schema.ts

type UserList = {
  users: User[];
};

type User = {
  name: string;
  image: string;
};
```

2. Load it into Scrubbr and serialize your data:

```typescript
import Scrubbr from 'scrubbr';

// Load the typescript file and convert it to a schema that will be used later.
// Performance note: this is a synchronous file load. Load early and cache to a shared variable.
const scrubbr = new Scrubbr('./schema.ts');

async function api() {
  const data = getUsers();

  // Serialize the data based on the PostList type defined in schema.ts
  return await scrubbr.serialize(data, 'UserList');
}

// Raw unsanitized data
function getUsers() {
  return {
    users: [
      {
        name: 'John Doe',
        image: 'http://i.pravatar.cc/300',
        email: 'donotspam@me.com',
        password: 'xxxsecretxxx',
      },
    ],
  };
}
```

3. Output

```json
{
  "users": [
    {
      "name": "John Doe",
      "image": "http://i.pravatar.cc/300"
    }
  ]
}
```

# Custom Serializers

You can define custom functions to change how the data is serialized.

## Type Serializer

This function is called every time a matching TypeScript type is encountered.

For example, if you want to use another type to serialize a user who is logged in:

```typescript
import Scrubbr, { useType } from 'scrubbr';

// Called ever time scrubbr finds a User type object
scrubbr.addTypeSerializer('User', (data, state) => {
  // This uses the context object that can be passed when serializing (see below)
  if (data.id === state.context.loggedInUserId) {
    return useType('UserPrivileged');
  }

  // You can also manually transform the data here
  return data;
});

// Context is passed to the serializers
const context = {
  loggedInUserId: 10,
};
const serialized = await scrubbr.serialize(data, 'PostList', context);
```

## Path serializer

This serializer is called at each node of the data object regardless of type. It's called a path serializer because you'll use the `state.path` value to determine which node you're serializing.

In this example we want to convert every `createdAt` date value to the local timezone.

```typescript
import moment from 'moment-timezone';
import Scrubbr, { useType } from 'scrubbr';

// This function is called ever time scrubbr finds a User type object
scrubbr.addPathSerializer('User', (data, state) => {
  // Convert all date-like strings from UTC to local time
  const path = state.path;
  if (path.match(/\.createdAt$/)) {
    return moment(data).tz(state.context.timezone).format();
  }
  return data;
});

const context = {
  timezone: 'America/Los_Angeles',
};
const serialized = await scrubbr.serialize(data, 'PostList', context);
```

# Try the example yourself

It's easy to try it yourself with the included example in `example/index.ts`. Just clone this repo, install the dependencies (`npm install`) and then run the example app with:

```shell
npm run example
```
