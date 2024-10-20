export default function excludeFields<
  T extends Record<string, any>,
  K extends keyof T,
>(obj: T, fields: K[]): Omit<T, K> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (!fields.includes(key as K)) {
        acc[key as Exclude<keyof T, K>] = value;
      }
      return acc;
    },
    {} as Omit<T, K>,
  );
}
