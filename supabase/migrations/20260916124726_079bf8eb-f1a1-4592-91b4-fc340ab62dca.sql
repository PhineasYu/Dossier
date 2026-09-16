ALTER TABLE public.cards ADD COLUMN question_origin text CHECK (question_origin IN ('for_child', 'child_moment'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO anon, authenticated;
GRANT ALL ON public.cards TO service_role;