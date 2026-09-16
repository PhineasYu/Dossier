CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_card_ids uuid[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX daily_checkins_user_date_key
  ON public.daily_checkins (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), checkin_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checkins TO anon, authenticated;
GRANT ALL ON public.daily_checkins TO service_role;

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their daily check-ins"
ON public.daily_checkins
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Demo guests manage the shared check-in"
ON public.daily_checkins
FOR ALL
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

CREATE OR REPLACE FUNCTION public.set_daily_checkins_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_daily_checkins_updated_at
BEFORE UPDATE ON public.daily_checkins
FOR EACH ROW EXECUTE FUNCTION public.set_daily_checkins_updated_at();