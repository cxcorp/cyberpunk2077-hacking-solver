export function fmtArr(value: number[]) {
  return value.map((ar) => ar.toString(16).toUpperCase()).join(" ");
}
