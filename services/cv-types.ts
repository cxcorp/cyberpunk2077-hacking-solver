export type WorkerAction = "load" | "process_screenshot";
type ActionSuffixes = "_success" | "_error";

type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`;
export type WorkerResultAction = Concat<WorkerAction, ActionSuffixes>;
