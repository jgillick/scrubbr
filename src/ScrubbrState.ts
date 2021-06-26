import { JSONSchema7 } from 'json-schema';
import { LogLevel, Logger } from './Logger';
import { ScrubbrOptions } from './types';

export class ScrubbrState {
  /**
   * The current object path
   */
  path: string = '';

  /**
   * The property name of the data being serialized.
   */
  name: string = '';

  /**
   * If we're currently serializing an array, this is the array index
   */
  index: number | null = null;

  /**
   * The state of the parent node
   */
  parent: ScrubbrState | null = null;

  /**
   * Unserialized data at this node.
   */
  originalData: any;

  /**
   * The schema type we're serializing the document with.
   */
  rootSchemaType: string = '';

  /**
   * The schema type of the current data node.
   */
  schemaType: string | null = null;

  /**
   * JSON Schema object of the current data node type.
   */
  schemaDef: JSONSchema7;

  /**
   * The context object passed in to the serialize function.
   */
  context: any = {};

  /**
   * The nesting level at this node of the data being serialized
   */
  nesting: number = 0;

  /**
   * The schema types that have been used to serialize this node.
   */
  seenTypes: string[] = [];

  logger: Logger;
  options: ScrubbrOptions;

  constructor(
    data: any,
    schema: JSONSchema7,
    options: ScrubbrOptions,
    context: any,
    path: string = '',
    nesting: number = 0
  ) {
    this.context = context;
    this.originalData = data;
    this.schemaDef = schema;
    this.path = path;
    this.options = options;
    this.nesting = nesting;

    this.logger = new Logger(options, nesting);
  }

  /**
   * Create a child property node state, derived off of this state.
   */
  createNodeState(data: any, name: string, path: string, schema: JSONSchema7): ScrubbrState {
    const state = new ScrubbrState(
      data,
      schema,
      this.options,
      this.context,
      path,
      this.nesting + 1
    );
    state.name = name;
    state.parent = this;
    state.rootSchemaType = this.rootSchemaType;
    return state;
  }

  /**
   * Create a child array index state, derived off of this state.
   */
   createListState(data: any, index: number, path: string, schema: JSONSchema7): ScrubbrState {
    const state = new ScrubbrState(
      data,
      schema,
      this.options,
      this.context,
      path,
      this.nesting + 1
    );
    state.index = index;
    state.parent = this;
    state.rootSchemaType = this.rootSchemaType;
    return state;
  }
}
