import * as bcrypt from 'bcryptjs';

export class PasswordService {
  static async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
  }

  static compare(plainPassword: string, hash: string): boolean {
    return bcrypt.compareSync(plainPassword, hash);
  }
}
