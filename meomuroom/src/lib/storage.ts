// 게시글 사진을 Supabase Storage에 실제로 업로드합니다.
//
// 이전에는 회원이 사진이 올려져 있는 외부 URL을 직접 입력해야 했는데, 이제는
// 휴대폰/컴퓨터에서 사진 파일을 바로 선택해서 올릴 수 있습니다. Next.js
// Server Action은 <input type="file">이 있는 <form>을 그대로 받을 수 있어서
// (formData.get('image')가 File 객체), 별도의 업로드 API 없이 서버 액션
// 안에서 바로 이 함수를 호출합니다.

import { getSupabaseAdmin } from './supabaseAdmin';

const BUCKET = 'post-images';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// communityId 등 폴더 이름이 될 문자열과 File을 받아, 업로드 성공 시 누구나
// 볼 수 있는 공개 URL을 돌려줍니다. (post-images 버킷은 public이라 별도
// 서명 없이 이 URL로 바로 이미지를 보여줄 수 있습니다 — supabase/migration_2026-09_membership_and_storage.sql 참고.)
export async function uploadPostImage(file: File, folder: string): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error('사진은 jpg, png, webp, gif 형식만 올릴 수 있어요.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('사진 용량은 5MB를 넘을 수 없어요.');
  }

  const supabase = getSupabaseAdmin();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error('사진 업로드에 실패했습니다: ' + error.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
