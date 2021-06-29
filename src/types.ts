import { JSONSchema7 } from 'json-schema';
import { ScrubbrState } from './ScrubbrState';
import { LogLevel } from './Logger';

/**
 * Serializer function called for a specific TypeScript type.
 * @public
 */
export type TypeSerializer = (
  data: unknown,
  state: ScrubbrState
) => unknown | Promise<unknown>;

/**
 * Serializer called for each node within the data object that is being serialized.
 * @public
 */
export type GenericSerializer = (
  data: unknown,
  state: ScrubbrState
) => unknown | Promise<unknown>;

/**
 * Options passed to the Scrubbr constructor
 */
export type ScrubbrOptions = {
  /**
   * Set the logger level: LogLevel.NONE, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG
   * @defaultValue LogLevel.WARN
   * @public
   */
  logLevel?: LogLevel;

  /**
   * Add indents to better show where in the object it is.
   * This is most useful when logLevel is set to LogLevel.DEBUG.
   * @defaultValue false
   * @public
   */
  logNesting?: boolean | string;

  /**
   * A string prefix you want to precede all log messages
   * @defaultValue ""
   * @public
   */
  logPrefix?: string;

  /**
   * Throw an exception on errors that could effect the integrity of your data.
   * Otherwise, the error will just be logged if the log level is set to LogLevel.ERROR or above.
   * @defaultValue true
   * @public
   */
  throwOnError?: boolean;
};

/**
 * JSON Schema object that can be passed into Scrubbr.
 * This needs to follow the format that `ts-json-schema-generator` uses:
 *    * All types are defined in the root `definitions` block.
 *    * All references (`$ref`) point to definitions within the JSON object.
 *      (i.e. no external references)
 * @public
 */
export type JSONSchemaDefinitions =
  | JSONSchema7
  | {
      definitions: {
        [k: string]: JSONSchema7;
      };
    };
