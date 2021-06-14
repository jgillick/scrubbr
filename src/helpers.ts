import { ScrubbrState } from './ScrubbrState';

/**
 * Inform the serializer to use a particular type on a data node
 */
export function useType(
  typeName: string,
  data: any,
  state: ScrubbrState
): UseType {
  return new UseType(typeName, data, state);
}

export class UseType {
  data: any;
  typeName: string;
  state: ScrubbrState;

  constructor(typeName: string, data: any, state: ScrubbrState) {
    this.typeName = typeName;
    this.data = data;
    this.state = state;
  }
}
