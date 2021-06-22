# Scrubbr

[![Tests](https://github.com/jgillick/scrubbr/actions/workflows/test.yml/badge.svg)](https://github.com/jgillick/scrubbr/actions)
[![npm version](https://img.shields.io/npm/v/scrubbr)](https://badge.fury.io/js/scrubbr)

<!-- [![downloads](https://img.shields.io/npm/dm/Scrubbr)](https://www.npmjs.com/package/scrubbr) -->

Serialize and sanitize JSON data using TypeScript.

![Simple Example](https://github.com/jgillick/scrubbr/raw/main/example.png)

Serializing data sent from the webserver to the client shouldn't be hard. If you're already using TypeScript, you have everything you need. Scrubbr will use your TypeScript types to deeply transform and sanitize your data.

## Table of contents

- Install
- Quick Start
- Custom Serializer Functions
  - Type Serializers
  - Path Serializers
- Cache the generated schema to disk
- Schema Validation
- Troubleshooting
  - Look at the generated schema
  - Enable debug logging

## Install

```shell
npm i -S scrubbr
```

## Quick Start

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

// Load the typescript schema file
// PERFORMANCE NOTE: this is a synchronous call! Load early and cache to a shared variable.
const scrubbr = new Scrubbr('./schema.ts');

async function api() {
  const data = getUsers();

  // Serialize the data based on the UserList type defined in schema.ts
  return await scrubbr.serialize('UserList', data);
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

## Custom Serializer Functions

You can define additional functions for custom serializations.

### Type Serializers

Type serializer functions are called every time a matching TypeScript type is encountered.

For example, if you want to use another type to serialize a logged-in user:

```typescript
import Scrubbr, { useType } from 'scrubbr';

// Called every time scrubbr finds a User type object
scrubbr.addTypeSerializer('User', (data, state) => {
  // `context` is a value you pass to scrubbr.serialize (see below)
  if (data.id === state.context.loggedInUserId) {
    return useType('UserPrivileged');
  }

  // You can manually transform the data here
  return data;
});

// Context can be anything you want
const context = {
  loggedInUserId: 10,
};
const serialized = await scrubbr.serialize('PostList', data, context);
```

### Path Serializers

This serializer is called at each node of the data object, regardless of type. It's called a path serializer because you'll use the `state.path` value to determine which node you're serializing.

In this example we want to convert every `createdAt` date value to the local timezone.

```typescript
import moment from 'moment-timezone';
import Scrubbr, { useType } from 'scrubbr';

// Convert date-like strings from UTC to local time
scrubbr.addPathSerializer((data, state) => {
  const path = state.path;
  if (path.match(/\.createdAt$/)) {
    return moment(data).tz(state.context.timezone).format();
  }
  return data;
});

const context = {
  timezone: 'America/Los_Angeles',
};
const serialized = await scrubbr.serialize('PostList', data, context);
```

## Try it yourself

It's easy to try it yourself with the included example in `example/index.ts`. Just clone this repo, install the dependencies (`npm install`) and then run the example app with:

```shell
npm run example
```

## Caching the generated schema to disk

To optimize startup time, you can save the schema object scrubbr uses internally to disk during your build step and then load it directly when you initialize scrubbr. Internally, scrubbr uses the [ts-json-schema-generator](https://www.npmjs.com/package/ts-json-schema-generator) library to convert TypeScript to a JSON schema file. NOTE: you cannot load any JSON schema file into scrubbr, it needs to follow the conventions of ts-json-schema-generator.

**Build**

```shell
npx ts-json-schema-generator -f ./tsconfig.json -e all -p ./schema.ts -o ./dist/schema.json
```

**Runtime code**

```typescript
import Scrubbr, { JSONSchemaDefinitions } from 'scrubbr';

// Set resolveJsonModule to true in your tsconfig, otherwise use require()
import * as schema from './schema.json';
const scrubbr = new Scrubbr(schema as JSONSchemaDefinitions);
```

## Schema Validation

For the sake of performance and simplicity, scrubber does not perform a schema validation step (it outputs data, not validates). However, under the hood scrubbr converts TypeScript to JSONSchema (via the great [ts-json-schema-generator](https://www.npmjs.com/package/ts-json-schema-generator) package). So you can easily use [ajv](https://www.npmjs.com/package/ajv) to validate the serialized object.

```typescript
import Ajv from 'ajv';
import Scrubbr from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts');

async function main() {
  // Serialize
  const output = await scrubbr.serialize('UserList', data);
  const jsonSchema = scrubbr.getSchema();

  // Validate
  const ajv = new Ajv();
  const schemaValidator = ajv.compile(jsonSchema);
  const isValid = schemaValidator(output);
  if (!isValid) {
    console.error(schemaValidator.errors);
  }
}
```

## Troubleshooting

### Look at the generated schema

If scrubbr is not returning the data you're expecting, the first place to look is at the internal schema definitions:

```typescript
console.log(scrubbr.getSchema());
```

_This is a [JSON schema](https://json-schema.org/understanding-json-schema/) that is created from your TypeScript file._

Next look at the schema definition for the TypeScript type you're trying to serialize to.

```typescript
// return scrubbr.serialize('UserList', data);
console.log(scrubbr.getSchemaForType('UserList'));
```

Verify that this returns a JSON Schema object and that it contains the properties you want serialized.

### Debugging output

Enable debug logging:

```typescript
import Scrubbr, { LogLevel } from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts', { logLevel: LogLevel.DEBUG });
```

Scrubbr can also nest the logs to make it easier to read:

```typescript
const scrubbr = new Scrubbr('./schema.ts', {
  logLevel: LogLevel.DEBUG,
  logNesting: true,
});
```

And you can even enter the indent string to use for each level of nesting:

```typescript
const scrubbr = new Scrubbr('./schema.ts', {
  logLevel: LogLevel.DEBUG,
  logNesting: '~~>',
});
```

# License

[MIT](https://github.com/ajv-validator/ajv/blob/HEAD/LICENSE)
