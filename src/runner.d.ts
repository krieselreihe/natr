export interface AssertDescription {
  readonly given: string;
  readonly should: string;
  readonly actual: any;
  readonly expected: any;
}

export type AssertFunction = (description: AssertDescription) => void;

export type UnitTest = (assert: AssertFunction) => Promise<void> | void;

export type ExecuteCallback<ActualType> = () =>
  | Promise<ActualType>
  | ActualType;

export type Snapshot = object;

export type SnapshotResolver = (name: string, value: Snapshot) => Snapshot;

export function toMatchSnapshot(): SnapshotResolver;

export function execute<ActualType>(
  callback: ExecuteCallback<ActualType>,
): Promise<ActualType> | ActualType;

export function describe(name: string, unit: UnitTest): void;
