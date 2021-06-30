import * as path from 'path';
import Scrubbr, { LogLevel, useType } from '../src/';

// Example data: A list of post with comments
const data = {
  posts: [
    {
      title: `Pineapple on pizza`,
      body: `How do people feel about pineapple on pizza?`,
      image: `http://example.com/1234`,
      createdAt: new Date(`2021-06-10T00:02:00.000Z`),
      author: {
        id: 10,
        name: `Benny Troller`,
        email: `nospam@me.com`,
        lastLogin: new Date(`2021-06-10T00:02:00.000Z`),
      },
      comments: [
        {
          message: `I'm offended you would even ask!`,
          createdAt: new Date(`2021-06-11T00:12:58.134Z`),
          user: {
            id: 1,
            name: `Johnny Walker`,
            email: `spam@example.com`,
            lastLogin: new Date(`2021-06-11T00:12:58.134Z`),
          },
        },
        {
          message: `It's my favorite topping and I will fight anyone who disagrees.`,
          createdAt: new Date(`2021-06-11T00:14:00.000Z`),
          user: {
            id: 2,
            name: `Mary Lou`,
            email: `mary@example.com`,
            lastLogin: new Date(`2021-06-11T00:14:00.000Z`),
          },
        },
      ],
    },
  ],
};

async function main() {
  try {
    // Load the typescript schema
    const filepath = path.resolve(`${__dirname}/schema.ts`);
    const scrubbr = new Scrubbr(filepath, {
      logLevel: LogLevel.INFO,
    });

    // View the schema scrubbr created from the TypeScript file
    // printSchema(scrubbr);

    // The context object will be passed to serializers
    const context = {
      loggedInUserId: 10,
    };

    // Show full user for the logged-in user
    scrubbr.addTypeSerializer('UserPublic', (data: any, state) => {
      if (data.id === state.context.loggedInUserId) {
        return useType('UserPrivileged');
      }
      return data;
    });

    // Serialize the data
    const serialized = await scrubbr.serialize('PostList', data, context);
    console.log('======================');
    console.log('Serialized Output:');
    console.log('======================');
    console.log(JSON.stringify(serialized, null, '  '));
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
}

function printSchema(scrubbr: Scrubbr) {
  const schema = JSON.stringify(scrubbr.getSchema(), null, '  ');
  console.log('======================');
  console.log('Schema:');
  console.log('======================');
  console.log(schema);
}

main();
