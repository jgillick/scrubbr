# Troubleshooting

## Look at the generated schema

If scrubbr is not returning the data you're expecting, the first place to look is at the internal schema definitions:

```typescript
console.log(scrubbr.getSchema());
```
This is the [JSON schema](https://json-schema.org/understanding-json-schema/) that was created from your TypeScript file.

Next look at the schema definition for the type you're trying to serialize to.

```typescript
console.log(scrubbr.getSchemaFor('UserList'));
```

Verify that this returns a [JSON schema](https://json-schema.org/understanding-json-schema/) object and that it contains the properties you want serialized.

## Debug output

To enable debug logging:

```typescript
import Scrubbr, { LogLevel } from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts', { logLevel: LogLevel.DEBUG });
```

Scrubbr can also nest the logs to make it easier to read:

```typescript
const scrubbr = new Scrubbr('./schema.ts', {
  logLevel: LogLevel.DEBUG,
  logNesting: true, // or enter a string if you want to use a custom indention
});
```
