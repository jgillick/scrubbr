/**
 * Override the type that's being serialized.
 * The return value from this function should be used by custom serializers.
 *
 * @example
 * ```
 *  // Convert all User types to PublicUser
 *  scrubbr.typeSerializer('User', (data, state) =\> useType('PublicUser'));
 * ```
 *
 * @public
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
