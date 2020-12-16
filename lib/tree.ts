export interface Node<T> {
  children: Node<T>[];
  value: T;
}

interface VisitNode<T> extends Node<T> {
  depth: number;
}

interface BeforeVisitFn<T> {
  (node: VisitNode<T>, seenNodes: VisitNode<T>[]): boolean;
}

export function bfsVisit<T>(
  roots: Node<T>[],
  visitor: (node: Node<T>, depth: number) => void = () => {},
  beforeVisit?: BeforeVisitFn<T>
): Node<T>[] {
  const seenNodes: VisitNode<T>[] = [];

  let queue: VisitNode<T>[] = [...roots.map((n) => ({ ...n, depth: 1 }))];
  while (queue.length > 0) {
    const node = queue.shift()!;

    if (beforeVisit && beforeVisit(node, seenNodes)) {
      continue;
    }

    seenNodes.push(node);
    visitor(node, node.depth);
    queue = queue.concat(
      node.children.map((child) => ({ ...child, depth: node.depth + 1 }))
    );
  }

  return seenNodes;
}

export function findMaxLeafBy<T>(nodes: Node<T>[], fn: (res: T) => number): T {
  const leafValues = nodes.flatMap((node) => getLeafValues(node));

  let maxR = leafValues[0];
  let max = fn(leafValues[0]);

  for (const val of leafValues) {
    const candidate = fn(val);
    if (candidate > max) {
      max = candidate;
      maxR = val;
    }
  }

  return maxR;
}

export function getRootsLeafValues<T>(nodes: Node<T>[]): T[] {
  return nodes.flatMap((node) => getLeafValues(node));
}

export function getLeafValues<T>(node: Node<T>, ret: T[] = []): T[] {
  if (node.children.length === 0) {
    return [...ret, node.value];
  }

  return ret.concat(
    node.children.flatMap((child) => getLeafValues(child, ret))
  );
}

export function getRootsAllValues<T>(nodes: Node<T>[]): T[] {
  return bfsVisit(nodes).map((node) => node.value);
}

export function getRootsMaxDepth<T>(nodes: Node<T>[]): number {
  return max(nodes.flatMap((node) => getMaxDepth(node))) + 1;
}

export function getMaxDepth<T>(node: Node<T>, depth: number = 0): number {
  return node.children.length === 0
    ? depth
    : max(node.children.flatMap((node) => getMaxDepth(node, depth + 1)));
}

function max(arr: number[]): number {
  return arr.reduce((max, val) => (val > max ? val : max));
}
