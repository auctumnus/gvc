export const ts = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const ds = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
