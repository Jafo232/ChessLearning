export type BoardAngle = { rotation: number; tilt: number };
export const defaultAngle: BoardAngle = { rotation: -20, tilt: 39 };
export const angleLimit = { rotation: [-55, 55], tilt: [25, 63] } as const;
export function limitAngle(rotation: number, tilt: number): BoardAngle {
  const clamp = (n: number, range: readonly [number, number]) => Math.round(Math.max(range[0], Math.min(range[1], n)));
  return { rotation: clamp(rotation, angleLimit.rotation), tilt: clamp(tilt, angleLimit.tilt) };
}
export function readAngle(): BoardAngle {
  try {
    const a = JSON.parse(localStorage.getItem("knightfall:angle") || "null");
    if (a && Number.isFinite(a.rotation) && Number.isFinite(a.tilt)) return limitAngle(a.rotation, a.tilt);
  } catch {}
  return defaultAngle;
}
