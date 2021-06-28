# Scrubbr

[![Tests](https://github.com/jgillick/scrubbr/actions/workflows/test.yml/badge.svg)](https://github.com/jgillick/scrubbr/actions)
[![npm version](https://img.shields.io/npm/v/scrubbr)](https://badge.fury.io/js/scrubbr)
[![downloads](https://img.shields.io/npm/dm/scrubbr)](https://www.npmjs.com/package/scrubbr)

Serialize JSON data using TypeScript.

![Simple Example](https://github.com/jgillick/scrubbr/raw/main/example.png)

Serializing data sent from the webserver to the client shouldn't be hard. If you're already using TypeScript, you have everything you need. Scrubbr will use your TypeScript types to deeply transform and sanitize your data.

[Documentation](https://jgillick.github.io/scrubbr/) | [API](https://jgillick.github.io/scrubbr/api/scrubbr/)

## Install

```shell
npm i -S scrubbr
```

## Quick Start

The simplest example is to filter out sensitive data.

In this example we want to filter the email and password out of this sample data:

```javascript
{
  users: [
    {
      name: 'John Doe',
      image: 'http://i.pravatar.cc/300',
      email: 'donotspam@me.com',
      password: 'xxxsecretxxx',
    },
  ],
};
```

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

// PERFORMANCE NOTE: this is a synchronous call!
// Load early and cache to a shared variable.
const scrubbr = new Scrubbr('./schema.ts');

async function api() {
  const data = getUsers();

  // Serialize the data based on the UserList type defined in schema.ts
  return await scrubbr.serialize('UserList', data);
}
```

3. Ouput

```typescript
{
  "users": [
    {
      "name": "John Doe",
      "image": "http://i.pravatar.cc/300"
    }
  ]
}
```

# Documentation

Read the [documentation](https://jgillick.github.io/scrubbr/) to learn how do do more with Scrubbr.

# License

[MIT](https://github.com/ajv-validator/ajv/blob/HEAD/LICENSE)
