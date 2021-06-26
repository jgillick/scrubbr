# Custom Serializers

Custom serializers give you the power to transform data and influence Scrubbr.

## Type Serializers

The most common serializer is the Type Serializer. This function is called whenever Scrubbr encounters a specific TypeScript type _anywhere_ in the data.


```typescript
scrubbr.addTypeSerializer('User', (data, state) => {
  // Do custom things here for User typed data
  return data;
});
```


## Context

You can pass a custom object to the serialize function, and it will be passed to your serializers inside the state param.

For example, it could be the ID of the logged-in user:

```typescript
const context = {
  userId: 5
}
scrubbr.addTypeSerializer('User', serializeUser);
const serialized = await scrubbr.serialize('MemberList', data, context);

// Only return the logged-in user
function serializeUser(data, state) {
  const { context } = state;
  if (data.id !== context.userId) {
    return null;
  }
  return data;
}
```

### Global Context

You can also set the context globally and it will be merged with the context passed into the serialize function. For example:

```typescript

function userLoggedIn(user) {
  scrubbr.setGlobalContext({ loggedInUserId: user.id });
}

function api() {
  const context = {
    timezone: 'America/Los_Angeles',
  };
  const serialized = await scrubbr.serialize('MemberList', data, context);
}

```

In this example, the context passed to serializers will potentially include both `timezone` and `loggedInUserId`, if the `userLoggedIn` function were called.

## Change Types

Your serializer can tell Scrubbr to use a different type for serialization with the `useType` function.

For example, maybe we want to use the limited `PublicUser` type for all `User` objects that are not the logged-in user:

```typescript
type User = {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = {
  id: number;
  name: string;
}
```

```typescript
import Scrubbr, { useType } from '../src/';

const context = {
  userId: 5
}
scrubbr.addTypeSerializer('User', serializeUser);
const serialized = await scrubbr.serialize('MemberList', data, context);

// Convert User to PublicUser for everyone but the logged-in user
function serializeUser(data, state) {
  const { context } = state;
  if (data.id !== context.userId) {
    return useType('PublicUser');
  }
  return data;
}
```

## Generic Serializers

Generic serializers are called for every node in the object being serialized. Be aware that this can slow down the overall serialization process.

```typescript
scrubbr.addGenericSerializer((data, state) => {
  // Transform the data here
  return data;
});
```

Inside the serializer you'll often uses the following state properties to determine where you are:

* `state.path` - The object path to where you are (i.e. `blog.posts[1].author.name`)
* `state.name` - The name of the property that is being serialized.
* `state.index` - If the node being serialized is an item in an array, this is the index in that array.

!!! note
    In most cases Type Serializers provide a cleaner and more elegant way to serialize your data than Generic Serializers.

Let's say we want to convert every `startTime` date value to the local timezone.

```typescript
type Event = {
  name: string;
  startTime: Date;
}
type Meeting = {
  name: string;
  startTime: string;
  recurring: string;
}
type AppointmentList = {
  events: Event[];
  meeting: Meeting[];
}
```

```typescript
import moment from 'moment-timezone';
import Scrubbr, {ScrubbrState} from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts');

function serializeStartTime(data: any, state: ScrubbrState) {
  const { name } = state;
  const { timezone } = state.context;

  if (name == 'startTime') {
    return moment(data).tz(timezone).format();
  }
  return data;
}

function api() {
  const data = getData();

  const context = {
    timezone: 'America/Los_Angeles',
  };
  scrubbr.addGenericSerializer(serializeStartTime);
  const serialized = await scrubbr.serialize('AppointmentList', data, context);
}

function getData() {
  return {
    events: [
      {
        name: 'Pool party',
        startTime: '2021-06-26T19:00:00.000Z',
      }
    ],
    meeting: [
      {
        name: 'Daily standup',
        startTime: '2021-06-25T17:00:00.000Z',
        recurring: 'daily',
      }
    ]
  }
}

```

### Alternate Example

But let's see a more elegant way to handle the previous example. Instead of using the crude generic serializer, you can apply a consistent type to `startTime`
and use a type serializer.

```typescript
type StartTime = Date;

type Event = {
  name: string;
  startTime: StartTime;
}
type Meeting = {
  name: string;
  startTime: StartTime;
}
type AppointmentList = {
  events: Event[];
  meeting: Meeting[];
  recurring: string;
}
```

```typescript
import moment from 'moment-timezone';
import Scrubbr, {ScrubbrState} from 'scrubbr';

const scrubbr = new Scrubbr('./schema.ts');

function serializeStartTime(data: any, state: ScrubbrState) {
  const { name } = state;
  const { timezone } = state.context;
  return moment(data).tz(timezone).format();
}

function api() {
  const data = getData();

  const context = {
    timezone: 'America/Los_Angeles',
  };
  scrubbr.addTypeSerializer('StartTime', serializeStartTime);
  const serialized = await scrubbr.serialize('AppointmentList', data, context);
}

function getData() {
  return {
    events: [
      {
        name: 'Pool party',
        startTime: '2021-06-26T19:00:00.000Z',
      }
    ],
    meeting: [
      {
        name: 'Daily standup',
        startTime: '2021-06-25T17:00:00.000Z',
        recurring: 'daily',
      }
    ]
  }
}

```
