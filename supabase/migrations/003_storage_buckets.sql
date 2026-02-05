-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('collages', 'collages', true);

-- Photos: authenticated users upload to own folder
CREATE POLICY "photos_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "photos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos');

-- Thumbnails: publicly readable
CREATE POLICY "thumbnails_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

-- Collages: publicly readable
CREATE POLICY "collages_select" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'collages');

CREATE POLICY "collages_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'collages');
