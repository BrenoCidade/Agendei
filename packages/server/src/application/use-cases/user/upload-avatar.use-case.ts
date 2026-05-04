import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NotFoundError, ValidationError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface UploadAvatarInput {
  userId: string;
  buffer: Buffer;
  mimetype: string;
  baseUrl?: string;
}

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadAvatarUseCase implements OnModuleInit {
  private supabase!: SupabaseClient;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_KEY são obrigatórios. Configure o .env do backend.',
      );
    }

    this.supabase = createClient(url, key);
  }

  async execute(input: UploadAvatarInput): Promise<string> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!ALLOWED_MIMETYPES.includes(input.mimetype)) {
      throw new ValidationError(
        'Only JPEG, PNG and WebP images are accepted',
        'INVALID_IMAGE_TYPE',
      );
    }

    if (input.buffer.length > MAX_SIZE_BYTES) {
      throw new ValidationError(
        'Image must be at most 2 MB',
        'IMAGE_TOO_LARGE',
      );
    }

    // Delete previous avatar to avoid accumulating stale files
    if (user.avatarUrl) {
      const oldFilename = user.avatarUrl.split('/').pop();
      if (oldFilename) {
        await this.supabase.storage.from('avatars').remove([oldFilename]);
      }
    }

    const ext = EXTENSION_MAP[input.mimetype];
    const timestamp = Date.now();
    const filename = `${input.userId}-${timestamp}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(filename, input.buffer, {
        contentType: input.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Falha no upload para o Supabase: ${uploadError.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const avatarUrl = publicUrlData.publicUrl;

    user.updateAvatar(avatarUrl);
    await this.userRepository.save(user);

    return avatarUrl;
  }
}
