-- ============================================
-- Storage Bucket Policies
-- Run this AFTER creating the buckets
-- ============================================

-- Allow public read access to sprites bucket
CREATE POLICY "Public Access sprites" ON storage.objects
FOR SELECT USING (bucket_id = 'sprites');

-- Allow public insert access to sprites bucket
CREATE POLICY "Public Upload sprites" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sprites');

-- Allow public update access to sprites bucket
CREATE POLICY "Public Update sprites" ON storage.objects
FOR UPDATE USING (bucket_id = 'sprites');

-- Allow public delete access to sprites bucket
CREATE POLICY "Public Delete sprites" ON storage.objects
FOR DELETE USING (bucket_id = 'sprites');

-- Allow public read access to audio bucket
CREATE POLICY "Public Access audio" ON storage.objects
FOR SELECT USING (bucket_id = 'audio');

-- Allow public insert access to audio bucket
CREATE POLICY "Public Upload audio" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio');

-- Allow public update access to audio bucket
CREATE POLICY "Public Update audio" ON storage.objects
FOR UPDATE USING (bucket_id = 'audio');

-- Allow public delete access to audio bucket
CREATE POLICY "Public Delete audio" ON storage.objects
FOR DELETE USING (bucket_id = 'audio');

-- Allow public read access to thumbnails bucket
CREATE POLICY "Public Access thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow public insert access to thumbnails bucket
CREATE POLICY "Public Upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

-- Allow public update access to thumbnails bucket
CREATE POLICY "Public Update thumbnails" ON storage.objects
FOR UPDATE USING (bucket_id = 'thumbnails');

-- Allow public delete access to thumbnails bucket
CREATE POLICY "Public Delete thumbnails" ON storage.objects
FOR DELETE USING (bucket_id = 'thumbnails');
