CREATE TABLE public.children (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  avatar_url text,
  theme_color text NOT NULL DEFAULT '#C2703D',
  birthdate date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  raw_text text NOT NULL,
  source text NOT NULL DEFAULT 'text'
);

CREATE TABLE public.cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'other',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profile_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.entries(id) ON DELETE SET NULL,
  field text NOT NULL,
  value text NOT NULL,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  doc_type text,
  extracted_json jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cards_child_date_idx ON public.cards (child_id, date DESC);
CREATE INDEX profile_facts_child_idx ON public.profile_facts (child_id, field, date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_facts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated;
GRANT ALL ON public.children TO service_role;
GRANT ALL ON public.entries TO service_role;
GRANT ALL ON public.cards TO service_role;
GRANT ALL ON public.profile_facts TO service_role;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo open access children" ON public.children FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access entries" ON public.entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access cards" ON public.cards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access profile_facts" ON public.profile_facts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "demo open access documents" ON public.documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "demo documents read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'documents');
CREATE POLICY "demo documents write" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documents');

INSERT INTO public.children (id, name, theme_color, birthdate) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Luca', '#C2703D', '2020-04-11'),
  ('22222222-2222-2222-2222-222222222222', 'Lucy', '#2E7D74', '2017-09-02');

INSERT INTO public.cards (child_id, date, title, body, category) VALUES
  ('11111111-1111-1111-1111-111111111111', current_date - 3, 'Said hi to a new kid all by himself', 'At the playground he walked straight up to a boy his age and said hi. Then looked back at me, proud.', 'courage'),
  ('11111111-1111-1111-1111-111111111111', current_date - 12, 'First time eating mango', 'He loved it, then his lips went a little puffy.', 'first-time'),
  ('11111111-1111-1111-1111-111111111111', current_date - 40, 'Wants to be a garbage truck driver', 'Because they get to hang off the back.', 'dream'),
  ('11111111-1111-1111-1111-111111111111', current_date - 96, 'Slept without the hallway light', 'He asked for it off himself.', 'courage'),
  ('11111111-1111-1111-1111-111111111111', current_date - 180, 'Afraid of the vacuum cleaner', 'Hid behind the sofa every time it came out.', 'fear'),
  ('11111111-1111-1111-1111-111111111111', current_date - 300, 'Built a tower taller than himself', 'Nine blocks. It fell. He laughed.', 'interest'),
  ('22222222-2222-2222-2222-222222222222', current_date - 1, 'Taught Luca to ride a bike', 'She held the back of his seat the whole way down the street.', 'friendship'),
  ('22222222-2222-2222-2222-222222222222', current_date - 8, 'Wants to be an astronaut this week', 'Last week it was a vet. She drew the rocket herself.', 'dream'),
  ('22222222-2222-2222-2222-222222222222', current_date - 30, 'Read a whole chapter out loud', 'Stopped twice, kept going both times.', 'first-time'),
  ('22222222-2222-2222-2222-222222222222', current_date - 75, 'Stood up for a friend at school', 'Told me about it in the car, very matter-of-fact.', 'courage'),
  ('22222222-2222-2222-2222-222222222222', current_date - 210, 'Afraid of the dark water at the lake', 'Would only go in up to her knees.', 'fear'),
  ('22222222-2222-2222-2222-222222222222', current_date - 400, 'Learned to whistle', 'Practised for three days straight.', 'interest'),
  ('22222222-2222-2222-2222-222222222222', current_date - 620, 'Wanted to be a vet', 'After the neighbour''s cat had kittens.', 'dream');

INSERT INTO public.profile_facts (child_id, field, value, date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'allergy', 'Mango — mild lip swelling', current_date - 12),
  ('11111111-1111-1111-1111-111111111111', 'medical', 'Mild eczema, cream at night', current_date - 200),
  ('11111111-1111-1111-1111-111111111111', 'height', '96', current_date - 400),
  ('11111111-1111-1111-1111-111111111111', 'height', '101', current_date - 200),
  ('11111111-1111-1111-1111-111111111111', 'height', '104', current_date - 20),
  ('11111111-1111-1111-1111-111111111111', 'weight', '14.2', current_date - 400),
  ('11111111-1111-1111-1111-111111111111', 'weight', '15.6', current_date - 200),
  ('11111111-1111-1111-1111-111111111111', 'weight', '16.4', current_date - 20),
  ('11111111-1111-1111-1111-111111111111', 'food_like', 'Blueberries', current_date - 90),
  ('11111111-1111-1111-1111-111111111111', 'food_dislike', 'Broccoli', current_date - 90),
  ('11111111-1111-1111-1111-111111111111', 'interest', 'Diggers and trucks', current_date - 60),
  ('11111111-1111-1111-1111-111111111111', 'friend', 'Otto from nursery', current_date - 3),
  ('22222222-2222-2222-2222-222222222222', 'allergy', 'Penicillin (noted by doctor)', current_date - 500),
  ('22222222-2222-2222-2222-222222222222', 'medical', 'Wears glasses for reading', current_date - 300),
  ('22222222-2222-2222-2222-222222222222', 'height', '104', current_date - 800),
  ('22222222-2222-2222-2222-222222222222', 'height', '109', current_date - 400),
  ('22222222-2222-2222-2222-222222222222', 'height', '112', current_date - 2),
  ('22222222-2222-2222-2222-222222222222', 'weight', '17.1', current_date - 800),
  ('22222222-2222-2222-2222-222222222222', 'weight', '19.0', current_date - 400),
  ('22222222-2222-2222-2222-222222222222', 'weight', '20.3', current_date - 2),
  ('22222222-2222-2222-2222-222222222222', 'food_like', 'Pancakes with lingonberry', current_date - 120),
  ('22222222-2222-2222-2222-222222222222', 'food_dislike', 'Mushrooms', current_date - 120),
  ('22222222-2222-2222-2222-222222222222', 'interest', 'Space and rockets', current_date - 8),
  ('22222222-2222-2222-2222-222222222222', 'friend', 'Nour, best friend at school', current_date - 75);