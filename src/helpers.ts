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
 * @param typeName - The type that this node should be serialized with.
 * @param serializedData - Serialized/transformed data for this node.
 * @public
 */
export function useType(typeName: string, serializedData?: unknown): UseType {
  return new UseType(typeName, serializedData);
}

export class UseType {
  typeName: string;
  data: unknown;

  constructor(typeName: string, data?: unknown) {
    this.typeName = typeName;
    this.data = data;
  }
}
