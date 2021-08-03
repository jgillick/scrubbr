# Tips & Tricks

## TypeScript Typing

If you want to cast the serialized data to the type you serialized it to, just use the angle brackets:

```typescript
import { UserList } from 'schema';

const results = scrubbr.serialize<UserList>('UserList', data);
```

## Improving startup performance

Converting the TypeScript to JSON can take a few moments. If you want to optimize startup time, you can save the schema to disk as part of your build step and then pass it directly to Scrubbr.

Internally, Scrubbr uses the [ts-json-schema-generator](https://www.npmjs.com/package/ts-json-schema-generator) library to convert TypeScript to JSON schema.

!!! warning
You cannot load just any JSON schema into scrubbr, it needs to follow the output conventions of [ts-json-schema-generator](https://www.npmjs.com/package/ts-json-schema-generator):

    * All types are defined in the root `definitions` object.
    * All references (`$ref`) point to definitions within the object. (i.e. no external references)

### Build Step

This will build your schema file (`schema.ts`) and output it to `dist/schema.json`.

```shell
npx ts-json-schema-generator -f ./tsconfig.json -e all -p ./schema.ts -o ./dist/schema.json
```

### Runtime code

```typescript
import Scrubbr, { JSONSchemaDefinitions } from 'scrubbr';

// Set `resolveJsonModule: true` in your tsconfig, otherwise use require()
import * as schema from './schema.json';

const scrubbr = new Scrubbr(schema as JSONSchemaDefinitions);
```

## Clone the scrubbr serializer

For performance reasons you might not want all the custom serializers for your entire app running on every object serialized. You also probably don't want to manually add the global serializers every time.

You can use `clone()` to create API-specific scrubbrs off the global version. The TypeScript schema, scrubbr options, and custome serializers will be included in the cloned version.

In this example we want the `userSerializer` used all data serialized and the `commentSerializer` only applied to the comment list API:

```typescript
// Global config
const scrubbr = new Scrubbr('./schema.ts');
scrubbr.addTypeSerializer('User', userSerializer);

// API endpoint
function commentListApi() {
  const commentScrubbr = scrubbr.clone();
  commentScrubbr.addTypeSerializer('Comment', commentSerializer);

  return scrubbr.serialize('CommentList', data);
}
```

## Schema Validation

For the sake of performance and simplicity, scrubber does not perform a schema validation. However, you can easily use [ajv](https://www.npmjs.com/package/ajv) to validate the serialized object.

```typescript
import Ajv from 'ajv';
import Scrubbr from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts');

async function main() {
  // Serialize
  const output = scrubbr.serialize('UserList', data);
  const jsonSchema = scrubbr.getSchemaFor('UserList');

  // Validate
  const ajv = new Ajv();
  const schemaValidator = ajv.compile(jsonSchema);
  const isValid = schemaValidator(output);
  if (!isValid) {
    console.error(schemaValidator.errors);
  }
}
```
