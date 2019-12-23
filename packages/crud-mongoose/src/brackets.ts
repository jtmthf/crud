export function brackets(
  whereFactory: (qb: {
    and(args: object[]): any;
    or(args: object[]): any;
    where(args: object): any;
  }) => void,
): object[] {
  const response: object[] = [];
  const and: object[] = [];
  const or: object[] = [];
  whereFactory({
    and(args) {
      and.push(args);
    },
    or(args) {
      or.push(args);
    },
    where(args) {
      response.push(args);
    },
  });

  if (and.length) {
    response.push({ $and: and });
  }
  if (or.length) {
    response.push({ $or: or });
  }
  return response;
}
