import { IPasswordService } from '../../domain/services/IPasswordService';
import * as bcrypt from 'bcryptjs';

export class BcryptPasswordService implements IPasswordService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 8);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
