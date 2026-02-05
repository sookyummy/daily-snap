-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: get public user id from auth uid
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$;

-- Helper: check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = public.get_user_id()
  )
$$;

-- USERS
CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "users_select_group_members" ON public.users FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT gm.user_id FROM public.group_members gm
      WHERE gm.group_id IN (
        SELECT gm2.group_id FROM public.group_members gm2
        WHERE gm2.user_id = public.get_user_id()
      )
    )
  );

CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated
  USING (auth_id = auth.uid());

-- GROUPS
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "groups_insert" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (owner_id = public.get_user_id());

CREATE POLICY "groups_update_owner" ON public.groups FOR UPDATE TO authenticated
  USING (owner_id = public.get_user_id());

-- GROUP MEMBERS
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_user_id());

-- MISSIONS
CREATE POLICY "missions_select" ON public.missions FOR SELECT TO authenticated
  USING (public.is_group_member(group_id));

-- SUBMISSIONS: only see own submissions or all when mission is complete
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT TO authenticated
  USING (
    user_id = public.get_user_id()
    OR mission_id IN (
      SELECT m.id FROM public.missions m
      WHERE m.is_completed = TRUE AND public.is_group_member(m.group_id)
    )
  );

CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_user_id()
    AND mission_id IN (
      SELECT m.id FROM public.missions m
      WHERE public.is_group_member(m.group_id)
    )
  );

CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE TO authenticated
  USING (user_id = public.get_user_id());

-- PUSH SUBSCRIPTIONS
CREATE POLICY "push_subs_all" ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = public.get_user_id());
