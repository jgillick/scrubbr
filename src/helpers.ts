/**
 * Override the type that's being serialized.
 * The return value from this function should be used by custom serializers.
 *
 * @example
 *  // Convert all `User` types to `RestrictedUser`
 *  scrubbr.typeSerializer('User', (data, state) => useType('RestrictedUser'));
 *
 */
export function useType(typeName: string): UseType {
  return new UseType(typeName);
}

export class UseType {
  typeName: string;
  constructor(typeName: string) {
    this.typeName = typeName;
  }
}
