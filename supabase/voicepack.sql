-- MAHJONG · 보이스팩 음성 파일 (관리자만 올리기 · 지우기 · 누구나 듣기)
-- Supabase → SQL Editor 에서 한 번 실행하세요.
drop policy if exists "mj voice write" on storage.objects;
drop policy if exists "mj voice update" on storage.objects;
drop policy if exists "mj voice delete" on storage.objects;
create policy "mj voice write" on storage.objects for insert to authenticated with check (bucket_id = 'mahjong-skins' and (storage.foldername(name))[1] = 'voice' and mahjong.is_admin());
create policy "mj voice update" on storage.objects for update to authenticated using (bucket_id = 'mahjong-skins' and (storage.foldername(name))[1] = 'voice' and mahjong.is_admin());
create policy "mj voice delete" on storage.objects for delete to authenticated using (bucket_id = 'mahjong-skins' and (storage.foldername(name))[1] = 'voice' and mahjong.is_admin());
