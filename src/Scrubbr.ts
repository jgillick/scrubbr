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

export type Options = {
  logLevel?: LogLevel;
};

type ObjectNode = Record<string, any>;

export default class Scrubbr {
  options: Options;
  private logger: Logger;
  private schema: JSONSchema7 = {};
  private typeSerializers = new Map<string, TypeSerializer[]>();
  private pathSerializers: PathSerializer[] = [];

  constructor(
    schema: string | JSONSchema7,
    options: Options = {},
    typeSerializers?: Map<string, TypeSerializer[]>,
    pathSerializers?: PathSerializer[]
  ) {
    this.options = options;
    this.logger = new Logger(options.logLevel || LogLevel.NONE);
    this.loadSchema(schema);

    if (typeSerializers) {
      this.typeSerializers = new Map(typeSerializers);
    }
    if (pathSerializers) {
      this.pathSerializers = pathSerializers;
    }
  }

  /**
   * Create new scrubber with the same options and custom serializers
   */
  clone(options: Options): Scrubbr {
    return new Scrubbr(
      this.schema,
      options,
      this.typeSerializers,
      this.pathSerializers
    );
  }

  /**
   * Replace the schema with a new one
   */
  loadSchema(schema: string | JSONSchema7) {
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
        .createSchema();
    }

    // Set JSON Schema
    this.schema = schema;
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
   * Add a function to serialize schema types
   */
  addTypeSerializer(typeName: string, serializer: TypeSerializer) {
    const serializerList = this.typeSerializers.get(typeName) || [];
    serializerList.push(serializer);
    this.typeSerializers.set(typeName, serializerList);
  }

  /**
   * Add a function to serialize an object path.
   */
  addPathSerializer(serializer: PathSerializer) {
    this.pathSerializers.push(serializer);
  }

  /**
   * Serialize data
   */
  serialize(
    data: Object,
    schemaType: string,
    context: any = null
  ): Promise<any> {
    this.logger.info(`Serializing data with TS type: '${schemaType}'`);
    const definitions = this.schema?.definitions || {};

    const schema = definitions[schemaType] as JSONSchema7;
    if (!schema) {
      throw new Error(`Could not find the type: ${schemaType}`);
    }

    // Validate JSON and clone
    const cloned = JSON.parse(JSON.stringify(data));

    const state: ScrubbrState = new ScrubbrState(data, schema, context);
    state.rootSchemaType = schemaType;
    state.schemaType = schemaType;
    return this.walkData(cloned, state);
  }

  /**
   * Serialize a single node, recursively
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
   * Serialize an object in the data structure
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
      this.logger.debug(propPath, state.nesting);

      const propState = state.nodeState(propPath, propSchema);

      // Property not defined in the schema, do not serialize property
      if (!propSchema) {
        this.logger.debug(
          `Property '${name}' not defined in ${state.schemaType}.`,
          propState.nesting
        );
        continue;
      }

      filteredNode[name] = await this.walkData(value, propState);
    }
    return filteredNode;
  }

  /**
   * Serialize an array node
   */
  private async walkArrayNode(
    node: Object[],
    state: ScrubbrState
  ): Promise<Object> {
    const schema = state.schemaDef;
    const listSchema = schema.items as JSONSchema7 | JSONSchema7[];

    let tupleSchema: JSONSchema7[] = [];
    const isTuple = Array.isArray(schema.items);
    if (Array.isArray(schema.items)) {
      tupleSchema = schema.items as JSONSchema7[];
    }

    const filteredNode = [];
    for (let i = 0; i < node.length; i++) {
      const value = node[i];
      const itemSchema = isTuple ? tupleSchema[i] : listSchema;

      const itemPath = `${state.path}[${i}]`;
      this.logger.debug(itemPath, state.nesting);
      const itemState = state.nodeState(itemPath, itemSchema as JSONSchema7);

      // Skip items past the tuple length
      if (isTuple && i >= tupleSchema.length) {
        this.logger.debug(`Index ${i} not defined in tuple`, itemState.nesting);
        break;
      }

      filteredNode[i] = await this.walkData(value, itemState);
    }

    return filteredNode;
  }

  /**
   * Serialize a node of data
   */
  private async serializeNode(
    data: Object,
    state: ScrubbrState
  ): Promise<Object> {
    const schemaType = this.getNodeType(state);
    if (schemaType) {
      this.setStateSchema(schemaType, state);
    }
    data = await this.runPathSerializers(data, state);
    data = await this.runTypeSerializers(data, state);

    // If the type is an alias to a union, walk one level deeper
    const { schemaDef } = state;
    if (
      schemaDef &&
      !schemaDef.properties &&
      (schemaDef.allOf || schemaDef.anyOf || schemaDef.oneOf)
    ) {
      this.logger.debug(
        `'${state.schemaType}' appears to be an union type.`,
        state.nesting
      );
      return this.serializeNode(data, state);
    }

    return data;
  }

  /**
   * Return the Typescript type(s), if any, from the schema.
   */
  private getNodeType(state: ScrubbrState): string | null {
    const schema = state.schemaDef;
    if (!schema) {
      return null;
    }

    let schemaList = (schema?.allOf ||
      schema?.anyOf ||
      schema?.oneOf ||
      []) as JSONSchema7[];
    const definitions = this.schema.definitions || {};

    if (schema.$ref) {
      schemaList.push(schema);
    }

    // Get all types defined
    let typeNames: string[] = [];
    schemaList.forEach((schemaRef) => {
      const refPath = schemaRef.$ref;
      if (!refPath) {
        return;
      }
      let typeName = refPath.replace(/#\/definitions\/(.*)/, '$1');
      typeName = decodeURI(typeName);
      if (definitions[typeName]) {
        typeNames.push(typeName);
      } else {
        this.logger.warn(
          `No type definitions found for '${typeNames}'`,
          state.nesting
        );
      }
    });

    // If there are multiple types, choose the one with the fewest properties (most restrictive)
    let chosenType = typeNames[0] || null;
    if (typeNames.length > 1) {
      this.logger.debug(
        `${typeNames.length} possible types (${typeNames}).`,
        state.nesting
      );

      let minProps = Infinity;
      typeNames.forEach((name) => {
        const typeSchema = definitions[name] as JSONSchema7;
        if (typeSchema?.properties) {
          const propNum = Object.keys(typeSchema.properties).length;
          if (propNum < minProps) {
            minProps = propNum;
            chosenType = name;
          }
        }
      });

      const others = typeNames.filter((n) => n != chosenType);
      this.logger.warn(
        `Guessing at type '${chosenType}' over ${others} because it has the fewest properties (you can explicitly override this selection with the 'useType()' function.).`,
        state.nesting
      );
    } else {
      this.logger.debug(`Type: '${chosenType}'`, state.nesting);
    }

    if (chosenType) {
      this.setStateSchema(chosenType, state);
    }

    return chosenType;
  }

  /**
   * Set the schema definition in the state
   */
  private setStateSchema(
    schemaType: string,
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

    if (primitiveTypes.includes(schemaType)) {
      state.schemaType = schemaType;
    } else {
      const definitions = this.schema.definitions || {};
      if (!definitions[schemaType]) {
        throw new Error(`Could not find a type definition for '${schemaType}'`);
      }

      state.schemaType = schemaType;
      state.schemaDef = definitions[schemaType] as JSONSchema7;
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

    this.logger.debug(
      `Running ${this.pathSerializers.length} path serializers`,
      state.nesting
    );

    return this.pathSerializers.reduce((promise, serializerFn) => {
      return promise.then((data) => {
        const serialized = serializerFn(data, state);
        if (serialized instanceof UseType) {
          this.logger.debug(
            `Overriding type: '${serialized.typeName}'`,
            state.nesting
          );
          this.setStateSchema(serialized.typeName, state);
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

    const definitions = this.schema.definitions || {};
    if (!definitions[typeName]) {
      throw new Error(`No type named '${typeName}'.`);
    }

    const serializerFns = this.typeSerializers.get(typeName) || [];
    if (!serializerFns.length) {
      return dataNode;
    }

    this.logger.debug(
      `Running ${serializerFns.length} serializers for type '${typeName}'`,
      state.nesting
    );

    for (let i = 0; i < serializerFns.length; i++) {
      const serialized = await serializerFns[i].call(null, dataNode, state);

      // Change type
      if (serialized instanceof UseType && serialized.typeName !== typeName) {
        this.logger.debug(
          `Overriding type: '${serialized.typeName}'`,
          state.nesting
        );
        this.setStateSchema(serialized.typeName, state);
        return await this.runTypeSerializers(dataNode, state);
      }
      dataNode = serialized;
    }

    return dataNode;
  }
}
