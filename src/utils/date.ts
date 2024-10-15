export const fiveMinutesAgo = () => {
  return new Date(Date.now() - 1000 * 60 * 5);
};

export const fifteenMinutesFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 15);
};

export const oneHourFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 60);
};

export const oneDayFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 60 * 24);
};

export const oneWeekFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
};

export const oneMonthFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
};

export const oneYearFromNow = () => {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
};

export const ONE_HOUR_MS = 60 * 60 * 1000;
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
