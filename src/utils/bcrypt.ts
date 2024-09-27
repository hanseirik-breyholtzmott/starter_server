import bcrypt from "bcrypt";

export const hashValue = async (value: string, saltRounds: number = 10) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(value, salt);
};

export const compareValue = async (value: string, hashedValue: string) => {
  return bcrypt.compare(value, hashedValue).catch(() => false);
};
