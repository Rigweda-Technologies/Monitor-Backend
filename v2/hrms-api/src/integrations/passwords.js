import bcrypt from 'bcryptjs';
export const createPasswords = rounds => ({
  hashPassword: password => bcrypt.hash(password, rounds),
  comparePassword: (password, hashed) => password && hashed ? bcrypt.compare(password, hashed) : Promise.resolve(false),
});
