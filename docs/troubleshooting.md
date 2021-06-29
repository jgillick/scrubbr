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

## Understanding the warning: _"Guessing: Using type 'xyz', instead of 'abc' , because it has the fewest properties"_

```
Guessing: Using type 'UserPublic', instead of 'UserRestricted', because it has the fewest properties at object path: 'user'.
(You can explicitly override this selection with the 'useType()' function in a custom serializer).
```

This warning happens when you have a type like this:

```typescript
type Payload = {
  user: UserPublic | UserRestricted;
};
```

When Scrubbr gets to the `user` property, it doesn't know exactly how to choose between `UserPublic` and `UserRestricted` and so it makes a guess and chooses the type that defines the fewest properties (most restrictive). In the interest of performance, Scrubbr avoids doing deep introspection and type checking.

To avoid this warning, use a type alias return the `useType` function in a serializer:

```typescript
type Payload = {
  user: User;
};
type User = UserPublic | UserRestricted;
```

```typescript
scrubbr.addTypeSerializer('User', (data, state) => {
  if (/* type choosing logic here */) {
    return useType('UserRestricted');
  }
  return useType('UserPublic');
}
```
