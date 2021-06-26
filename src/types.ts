/**
 * Serializer function called for a specific TypeScript type.
 */
export type TypeSerializer = (
  data: any,
  state: ScrubbrState
) => any | Promise<any>;

/**
 * Serializer called for each node within the data object that is being serialized.
 */
export type GenericSerializer = (
  data: any,
  state: ScrubbrState
) => any | Promise<any>;

/**
 * Options passed to the Scrubbr constructor
 */
export type ScrubbrOptions = {
  /**
   * Set the logger level: LogLevel.NONE, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG
   * @default LogLevel.NONE
   */
  logLevel?: LogLevel;

  /**
   * Add indents to better show where in the object it is.
   * This is most useful when logLevel is set to LogLevel.DEBUG.
   * @default false
   */
  logNesting?: boolean | string;

  /**
   * A string prefix you want to precede all log messages
   * @default ""
   */
  logPrefix?: string;

  /**
   * Throw an exception on errors that could effect the integrity of your data.
   * Otherwise, the error will just be logged if the log level is set to LogLevel.ERROR or above.
   * @default true
   */
  throwOnError?: boolean;
};

/**
 * JSON Schema object that can be passed into Scrubbr.
 * This needs to follow the format that `ts-json-schema-generator` uses:
 *    * All types are defined in the root `definitions` block.
 *    * All references (`$ref`) point to definitions within the JSON object.
 *      (i.e. no external references)
 */
export type JSONSchemaDefinitions =
  | JSONSchema7
  | {
      definitions: {
        [k: string]: JSONSchema7;
      };
    };
