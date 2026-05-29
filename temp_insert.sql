-- temporarily allow inserts for initial seeding
CREATE POLICY "Allow public insert temp" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.past_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.gallery_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.notices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.work_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert temp" ON public.partners FOR INSERT WITH CHECK (true);
