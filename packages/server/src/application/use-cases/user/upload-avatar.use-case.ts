import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError, ValidationError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { createClient } from '@supabase/supabase-js';

interface UploadAvatarInput {
  userId: string;
  buffer: Buffer;
  mimetype: string;
  /** Base URL da API, não é mais usado estritamente no Supabase, mas mantemos pela assinatura */
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
export class UploadAvatarUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL e SUPABASE_KEY não estão configurados no .env do backend.");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = EXTENSION_MAP[input.mimetype];
    // Usa um timestamp no nome para garantir que navegadores não façam cache da imagem antiga
    const timestamp = Date.now();
    const filename = `${input.userId}-${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, input.buffer, {
        contentType: input.mimetype,
        upsert: false, // Cria um novo arquivo por causa do timestamp
      });

    if (uploadError) {
      throw new Error(`Falha no upload para o Supabase: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    const avatarUrl = publicUrlData.publicUrl;

    user.updateAvatar(avatarUrl);
    await this.userRepository.save(user);

    return avatarUrl;
  }
}
