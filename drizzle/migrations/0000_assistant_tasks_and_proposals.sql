CREATE TABLE public.assistant_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
 kind text NOT NULL CHECK (kind IN ('reminder','event','draft','todo')),
 title text NOT NULL,
 details text NOT NULL DEFAULT '',
 due_at timestamptz,
 timezone text NOT NULL DEFAULT 'Europe/Stockholm',
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_tasks TO authenticated;
GRANT ALL ON public.assistant_tasks TO service_role;
ALTER TABLE public.assistant_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.assistant_tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX assistant_tasks_owner_due ON public.assistant_tasks(user_id, due_at);
CREATE TABLE public.assistant_proposals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
 actions jsonb NOT NULL DEFAULT '[]'::jsonb,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assistant_proposals TO authenticated;
GRANT ALL ON public.assistant_proposals TO service_role;
ALTER TABLE public.assistant_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own proposals" ON public.assistant_proposals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.assistant_ai_blocks (
 user_id uuid PRIMARY KEY,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assistant_ai_blocks TO authenticated;
GRANT ALL ON public.assistant_ai_blocks TO service_role;
ALTER TABLE public.assistant_ai_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own AI block" ON public.assistant_ai_blocks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.confirm_assistant_proposal(proposal_id uuid, approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.assistant_proposals; a jsonb; target uuid;
BEGIN
 SELECT * INTO p FROM public.assistant_proposals WHERE id = proposal_id AND user_id = auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Proposal not found'; END IF;
 IF p.status <> 'pending' THEN RETURN; END IF;
 IF NOT approve THEN UPDATE public.assistant_proposals SET status = 'cancelled' WHERE id = p.id; RETURN; END IF;
 FOR a IN SELECT value FROM jsonb_array_elements(p.actions) LOOP
  IF a->>'operation' = 'create' THEN
   INSERT INTO public.assistant_tasks(user_id, child_id, kind, title, details, due_at, timezone) VALUES (p.user_id,p.child_id,a->>'kind',a->>'title',COALESCE(a->>'details',''),NULLIF(a->>'dueAt','')::timestamptz,COALESCE(a->>'timezone','Europe/Stockholm'));
  ELSE
   target := (a->>'taskId')::uuid;
   IF NOT EXISTS (SELECT 1 FROM public.assistant_tasks WHERE id=target AND user_id=p.user_id) THEN RAISE EXCEPTION 'Task not found'; END IF;
   IF a->>'operation' = 'update' THEN
    UPDATE public.assistant_tasks SET title=a->>'title',details=COALESCE(a->>'details',''),due_at=NULLIF(a->>'dueAt','')::timestamptz,timezone=COALESCE(a->>'timezone','Europe/Stockholm') WHERE id=target AND user_id=p.user_id;
   ELSIF a->>'operation' = 'complete' THEN UPDATE public.assistant_tasks SET status='completed' WHERE id=target AND user_id=p.user_id;
   ELSIF a->>'operation' = 'delete' THEN DELETE FROM public.assistant_tasks WHERE id=target AND user_id=p.user_id;
   ELSE RAISE EXCEPTION 'Unsupported operation'; END IF;
  END IF;
 END LOOP;
 UPDATE public.assistant_proposals SET status = 'confirmed' WHERE id=p.id;
END; $$;
REVOKE ALL ON FUNCTION public.confirm_assistant_proposal(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_assistant_proposal(uuid,boolean) TO authenticated;