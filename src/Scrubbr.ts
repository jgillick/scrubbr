import * as fs from 'fs';
import * as path from 'path';
import { JSONSchema7 } from 'json-schema';
import * as tsj from 'ts-json-schema-generator';
import { LogLevel, Logger } from './Logger';
import { ScrubbrState } from './ScrubbrState';
import { UseType } from './helpers';

export type TypeSerializer = (
  data: any,
  state: ScrubbrState
) => any | Promise<any>;

export type PathSerializer = (
  data: any,
  state: ScrubbrState
) => any | Promise<any>;

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

const defaultOptions = {
  logLevel: LogLevel.NONE,
  logNesting: false,
  logPrefix: '',
  throwOnError: true,
};

type ObjectNode = Record<string, any>;
export type JSONSchemaDefinitions = {
  definitions: {
    [k: string]: JSONSchema7;
  };
};

export default class Scrubbr {
  options: ScrubbrOptions;
  private logger: Logger;
  private schema: JSONSchema7 = {};
  private typeSerializers = new Map<string, TypeSerializer[]>();
  private pathSerializers: PathSerializer[] = [];

  /**
   * Create new scrubbr serializer
   * @param {string | JSONSchema7} schema - The TypeScript schema file or JSON object to use for serialization.
   * @param {ScrubbrOptions} options - Scrubbr options.
   */
  constructor(
    schema: string | JSONSchemaDefinitions,
    options: ScrubbrOptions = {}
  ) {
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.logger = new Logger(options);
    this.loadSchema(schema);
  }

  /**
   * Create new scrubber with the same options and custom serializers
   */
  clone(options: ScrubbrOptions): Scrubbr {
    const cloned = new Scrubbr(this.schema as JSONSchemaDefinitions, options);

    this.pathSerializers.forEach((serializerFn) => {
      cloned.addPathSerializer(serializerFn);
    });
    this.typeSerializers.forEach((serializers, typeName) => {
      serializers.forEach((serializerFn) => {
        cloned.addTypeSerializer(typeName, serializerFn);
      });
    });

    return cloned;
  }

  /**
   * Replace the schema with a new one
   */
  loadSchema(schema: string | JSONSchemaDefinitions) {
    // Load typescript file
    if (typeof schema == 'string') {
      this.logger.info(`Loading typescript file: ${schema}`);

      if (!fs.existsSync(schema)) {
        throw new Error(
          `Could not find schema file at: ${path.resolve(schema)}`
        );
      }

      schema = tsj
        .createGenerator({
          path: schema,
          expose: 'all',
        })
        .createSchema() as JSONSchemaDefinitions;
    }

    // Set JSON Schema
    this.schema = schema as JSONSchema7;
    if (!this.schema.definitions) {
      throw new Error('No type definitions were found in your schema.');
    }
  }

  /**
   * Return the schema
   */
  getSchema(): JSONSchema7 {
    return this.schema;
  }

  /**
   * Return the schema for a TypeScript type.
   * @param {string} typeName - The name of the type to return the schema for.
   * @return {JSONSchema7 | null} The JSON schema for the type, or null if it was not found.
   */
  getSchemaForType(typeName: string): JSONSchema7 | null {
    const definitions = this.schema?.definitions || {};
    if (typeof definitions[typeName] === 'undefined') {
      return null;
    }
    return definitions[typeName] as JSONSchema7;
  }

  /**
   * Add a function to serialize a schema type
   * @param {string} typeName - The name of the type to register the serializer for.
   * @param {function} serializer - The serializer function.
   */
  addTypeSerializer(typeName: string, serializer: TypeSerializer) {
    const serializerList = this.typeSerializers.get(typeName) || [];
    serializerList.push(serializer);
    this.typeSerializers.set(typeName, serializerList);
  }

  /**
   * Add a custom serializer function that's called for each node in the object.
   * @param {function} serializer - The serializer function.
   */
  addPathSerializer(serializer: PathSerializer) {
    this.pathSerializers.push(serializer);
  }

  /**
   * Serialize data based on a TypeScript type.
   * @param {string} schemaType - The name of the typescript type to serialize the data with.
   * @param {object} data - The data to serialize
   * @param {any} context - Any data you want sent to the custom serializer functions.
   */
  async serialize<Type = any>(
    schemaType: string,
    data: Object,
    context: any = null
  ): Promise<Type> {
    this.logger.info(`Serializing data with TS type: '${schemaType}'`);

    const schema = this.getSchemaForType(schemaType);
    if (!schema) {
      throw new Error(`Could not find the type: ${schemaType}`);
    }

    // Validate JSON and clone
    const cloned = JSON.parse(JSON.stringify(data));

    const state: ScrubbrState = new ScrubbrState(
      data,
      schema,
      this.options,
      context
    );
    state.rootSchemaType = schemaType;
    state.schemaType = schemaType;
    const serialized = (await this.walkData(cloned, state)) as Type;
    return serialized;
  }

  /**
   * Traverse into a node of data on an object to serialize.
   * @param {object} node: The data object to start from
   * @param {ScrubbrState} state - The serializing state.
   */
  private async walkData(node: Object, state: ScrubbrState): Promise<Object> {
    const serializedNode = await this.serializeNode(node, state);

    if (serializedNode === null) {
      return serializedNode;
    } else if (Array.isArray(serializedNode)) {
      return await this.walkArrayNode(serializedNode, state);
    } else if (typeof serializedNode === 'object') {
      return await this.walkObjectNode(serializedNode, state);
    }
    return serializedNode;
  }

  /**
   * Serialize all the properties of an object.
   * @param {object} node - The object to serialize
   * @param {ScrubbrState} state - The serializing state.
   */
  private async walkObjectNode(
    node: ObjectNode,
    state: ScrubbrState
  ): Promise<Object> {
    const nodeProps = Object.entries(node);
    const schemaProps = state.schemaDef.properties || {};
    const filteredNode: ObjectNode = {};
    const pathPrefix = state.path ? `${state.path}.` : '';

    for (let i = 0; i < nodeProps.length; i++) {
      let [name, value] = nodeProps[i];
      let propSchema = schemaProps[name] as JSONSchema7;

      const propPath = `${pathPrefix}${name}`;
      state.logger.debug(`[PATH] ${propPath}`);
      const propState = state.createNodeState(propPath, propSchema);

      // Property not defined in the schema, do not serialize property
      if (!propSchema) {
        state.logger.debug(
          `Property '${name}' not defined in ${state.schemaType}.`
        );
        continue;
      }

      filteredNode[name] = await this.walkData(value, propState);
    }
    return filteredNode;
  }

  /**
   * Serialize all the items of an array.
   * @param {any} node[] - The array to serialize
   * @param {ScrubbrState} state - The serializing state.
   */
  private async walkArrayNode(node: any[], state: ScrubbrState): Promise<any> {
    const schema = state.schemaDef;
    const listSchema = schema.items as JSONSchema7 | JSONSchema7[];

    let tupleSchema: JSONSchema7[] = [];
    const isTuple = Array.isArray(schema.items);
    if (isTuple) {
      tupleSchema = schema.items as JSONSchema7[];
    }

    const filteredNode = [];
    for (let i = 0; i < node.length; i++) {
      const value = node[i];
      const itemSchema = isTuple ? tupleSchema[i] : listSchema;

      const itemPath = `${state.path}[${i}]`;
      state.logger.debug(`[PATH] ${itemPath}`);
      const itemState = state.createNodeState(
        itemPath,
        itemSchema as JSONSchema7
      );

      // Skip items past the tuple length
      if (isTuple && i >= tupleSchema.length) {
        state.logger.debug(`Index ${i} not defined in tuple`);
        break;
      }

      filteredNode[i] = await this.walkData(value, itemState);
    }

    return filteredNode;
  }

  /**
   * Serialize a single piece of data.
   * @param {any} data - The data to serialize
   * @param {ScrubbrState} state - The serializing state.
   */
  private async serializeNode(data: any, state: ScrubbrState): Promise<Object> {
    const originalDef = state.schemaDef;

    // Get typescript type for the schema definition
    const schemaType = this.getTypeName(state.schemaDef, state);
    if (schemaType) {
      const circularRef = this.isCircularReference(schemaType, state);
      if (circularRef) {
        return data;
      }
      state = this.setStateSchemaDefinition(schemaType, state);
    }

    // Run serializers
    data = await this.runPathSerializers(data, state);
    data = await this.runTypeSerializers(data, state);

    // If the type definition is an alias to a union, walk one level deeper
    const { schemaDef } = state;
    if (
      schemaDef &&
      schemaType &&
      originalDef !== schemaDef &&
      !schemaDef.properties &&
      (schemaDef.allOf || schemaDef.anyOf || schemaDef.oneOf)
    ) {
      state.logger.debug(`'${state.schemaType}' appears to be an union type.`);

      return this.serializeNode(data, state);
    }

    return data;
  }

  /**
   * Return the Typescript type(s), if any, from the schema.
   */
  private getTypeName(schema: JSONSchema7, state: ScrubbrState): string | null {
    if (!schema) {
      return null;
    }

    let schemaList = (schema?.allOf ||
      schema?.anyOf ||
      schema?.oneOf ||
      []) as JSONSchema7[];

    if (schema.$ref) {
      schemaList.push(schema);
    }

    // Get all the types we have definitions for
    let foundTypes = new Map<string, JSONSchema7>();
    schemaList.forEach((schemaRef) => {
      const refPath = schemaRef.$ref;
      if (!refPath) {
        return;
      }

      let typeName = refPath.replace(/#\/definitions\/(.*)/, '$1');
      typeName = decodeURI(typeName);
      const type = this.getSchemaForType(typeName);
      if (type) {
        foundTypes.set(typeName, type);
      } else {
        state.logger.warn(`No type definitions found for '${typeName}'`);
      }
    });

    // If there are multiple types, choose the one with the fewest properties (most restrictive)
    let chosenType: string | null = null;
    const typeNames = Array.from(foundTypes.keys());
    if (typeNames.length == 1) {
      chosenType = typeNames[0];
    }
    if (typeNames.length > 1) {
      state.logger.debug(`${typeNames.length} possible types (${typeNames}).`);

      let minProps = Infinity;
      typeNames.forEach((name) => {
        const typeSchema = foundTypes.get(name);
        if (typeSchema?.properties) {
          const propNum = Object.keys(typeSchema.properties).length;
          if (propNum < minProps) {
            minProps = propNum;
            chosenType = name;
          }
        }
      });

      const others = typeNames.filter((n) => n != chosenType);
      state.logger.warn(
        `Guessing at type '${chosenType}' over ${others} because it has the fewest properties (you can explicitly override this selection with the 'useType()' function.).`
      );
    } else {
      state.logger.debug(`Type: '${chosenType}'`);
    }

    return chosenType;
  }

  /**
   * Set the schema definition in the state
   */
  private setStateSchemaDefinition(
    schemaType: string | null,
    state: ScrubbrState
  ): ScrubbrState {
    const primitiveTypes = [
      'string',
      'number',
      'object',
      'array',
      'boolean',
      'null',
    ];

    if (schemaType) {
      if (primitiveTypes.includes(schemaType)) {
        state.schemaType = schemaType;
        state.schemaDef = {};
      } else {
        const schemaDef = this.getSchemaForType(schemaType);
        if (!schemaDef) {
          this.error(
            `Could not find a type definition for '${schemaType}'`,
            state
          );
          state.schemaType = null;
          state.schemaDef = {};
          return state;
        }

        this.isCircularReference(schemaType, state);
        state.schemaType = schemaType;
        state.schemaDef = schemaDef;
        state.seenTypes.push(schemaType);
      }
    }

    return state;
  }

  /**
   * Run serializers on the data path
   */
  private async runPathSerializers(
    dataNode: Object,
    state: ScrubbrState
  ): Promise<Object> {
    if (!this.pathSerializers.length) {
      return dataNode;
    }

    state.logger.debug(
      `Running ${this.pathSerializers.length} path serializers`
    );

    return this.pathSerializers.reduce((promise, serializerFn) => {
      return promise.then((data) => {
        const serialized = serializerFn(data, state);
        if (serialized instanceof UseType) {
          state.logger.debug(`Overriding type: '${serialized.typeName}'`);
          state = this.setStateSchemaDefinition(serialized.typeName, state);
          return data;
        }
        return serialized;
      });
    }, Promise.resolve(dataNode));
  }

  /**
   * Run serializers on property data
   */
  private async runTypeSerializers(
    dataNode: Object,
    state: ScrubbrState
  ): Promise<Object> {
    const typeName = state.schemaType;
    if (!typeName) {
      return dataNode;
    }

    if (!this.getSchemaForType(typeName)) {
      this.error(`No type named '${typeName}'.`, state);
      return dataNode;
    }

    const serializerFns = this.typeSerializers.get(typeName) || [];
    if (!serializerFns.length) {
      return dataNode;
    }

    state.logger.debug(
      `Running ${serializerFns.length} serializers for type '${typeName}'`
    );

    for (let i = 0; i < serializerFns.length; i++) {
      const serialized = await serializerFns[i].call(null, dataNode, state);

      // Change type
      if (serialized instanceof UseType && serialized.typeName !== typeName) {
        const { typeName } = serialized;
        state.logger.debug(`Overriding type: '${typeName}'`);

        // Check for circular reference
        const circularRef = this.isCircularReference(typeName, state);
        if (!circularRef) {
          state = this.setStateSchemaDefinition(typeName, state);
          return await this.runTypeSerializers(dataNode, state);
        }
      }
      dataNode = serialized;
    }

    return dataNode;
  }

  /**
   * Check if this type has already been processed at this level.
   */
  isCircularReference(typeName: string, state: ScrubbrState): boolean {
    if (state.seenTypes.includes(typeName)) {
      this.error(
        `Scrubbr detected a circular reference with type ${typeName} at object path: ${state.path}`,
        state
      );
      return true;
    }
    return false;
  }

  /**
   * Handle an error by either throwing an exception or logging it.
   */
  error(message: string, state: ScrubbrState) {
    if (this.options.throwOnError) {
      throw new Error(message);
    }
    state.logger.error(message);
  }
}
