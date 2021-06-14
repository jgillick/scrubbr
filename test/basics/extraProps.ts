import "jest";
import { writeTS } from "../setup";
import Scrubbr from "../../src/";

const tsFile = writeTS(`
  type User = {
    id: number;
    name: number;
  };
  type Post = {
    user: User;
  };
  type Invite = {
    guests: User[];
  }
`);
const scrubbr = new Scrubbr(tsFile);

describe("do not serialize properties not in schema", () => {
  test("root object", async () => {
    const data = {
      id: 1,
      name: "foo",
      email: "foo@boo.com",
    };
    const serialized = await scrubbr.serialize(data, "User");
    expect(serialized).toEqual(expect.objectContaining({ id: 1, name: "foo" }));
    expect(serialized.email).toBeUndefined();
  });

  test("child object", async () => {
    const data = {
      user: {
        id: 1,
        name: "foo",
        email: "foo@boo.com",
      },
    };
    const serialized = await scrubbr.serialize(data, "Post");
    expect(serialized.user).toEqual(
      expect.objectContaining({ id: 1, name: "foo" })
    );
    expect(serialized.user.email).toBeUndefined();
  });

  test("as array item", async () => {
    const data = {
      guests: [
        {
          id: 1,
          name: "foo",
          email: "foo@boo.com",
        },
      ],
    };
    const serialized = await scrubbr.serialize(data, "Invite");
    expect(serialized.guests[0]).toEqual(
      expect.objectContaining({ id: 1, name: "foo" })
    );
    expect(serialized.guests[0].email).toBeUndefined();
  });
});
