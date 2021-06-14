import { JSONSchema7 } from 'json-schema';

export class ScrubbrState {
  path: string = '/';
  schemaType: string | null = null;
  schemaDef: JSONSchema7;
  data: any;
  context: any = {};
  originalData: any;
  nesting: number = 0;

  constructor(data: any, schema: JSONSchema7, context: any, path: string = '') {
    this.context = context;
    this.data = data;
    this.schemaDef = schema;
    this.path = path;
  }

  /**
   * Create a child state off of this one
   */
  nodeState(path: string, schema: JSONSchema7): ScrubbrState {
    const state = new ScrubbrState(
      this.originalData,
      schema,
      this.context,
      path
    );
    state.nesting = this.nesting + 1;
    return state;
  }
}
