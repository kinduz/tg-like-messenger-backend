import { compare, hash } from 'bcrypt';

export const hashValue = (value: string) => {
  return hash(value, 10);
};

export const isValidHash = (value: string, hash: string) => {
  return compare(value, hash);
};
