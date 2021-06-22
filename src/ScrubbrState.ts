import { JSONSchema7 } from 'json-schema';
import { LogLevel, Logger } from './Logger';
import { ScrubbrOptions } from './Scrubbr';

export class ScrubbrState {
  path: string = '/';
  rootSchemaType: string = '';
  schemaType: string | null = null;
  schemaDef: JSONSchema7;
  data: any;
  context: any = {};
  originalData: any;
  nesting: number = 0;
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
    this.data = data;
    this.schemaDef = schema;
    this.path = path;
    this.options = options;
    this.nesting = nesting;

    this.logger = new Logger(options, nesting);
  }

  /**
   * Create a child state off of this one
   */
  createNodeState(path: string, schema: JSONSchema7): ScrubbrState {
    const state = new ScrubbrState(
      this.originalData,
      schema,
      this.options,
      this.context,
      path,
      this.nesting + 1
    );
    state.rootSchemaType = this.rootSchemaType;
    return state;
  }
}
