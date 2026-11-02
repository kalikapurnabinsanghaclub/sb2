import os

sql_path = r"C:\Users\soura\OneDrive\Desktop\kalikapur\setup_new_supabase.sql"

extra_sql = """

-- 18. TABLE: club_events (Compatibility & Outbox sync)
CREATE TABLE IF NOT EXISTS public.club_events (
    id TEXT PRIMARY KEY,
    name TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_events_all" ON public.club_events;
CREATE POLICY "club_events_all" ON public.club_events FOR ALL USING (true) WITH CHECK (true);

-- 19. SEED INITIAL GLOBAL SYNC STATE
INSERT INTO public.sync_state (id, payload)
VALUES 
  ('knsdc_global_sync', '{"activeEventId": null, "eventName": null, "organizer": "Kalikapur Nabin Sangha", "liveEventToday": null, "currentOnStage": null, "lastUpdated": 0, "participants": [], "chatMessages": [], "judges": [], "hostAssignments": [], "events": [], "upcomingEvents": [], "sosActive": false, "sosHistory": [], "judgeAgreements": []}'::jsonb),
  ('knsdc_finance_sync', '{"donations": [], "expenses": [], "earnings": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 20. SEED ACTIVE STAFF CREDENTIALS
INSERT INTO public.staff_credentials (email, password_hash, name, role, active)
VALUES 
  ('souravbairagi121999@gmail.com', '5440505a59224af2d0dea51b91cb84e3648a1e5cdfa16936ec47a3f68d8c7b42', 'Super Admin', 'admin', true),
  ('kalikapurnabinsanghaclub@gmail.com', 'ffb7bcda5db5dc45aa8058ab92162526f821cdb682308bcab5f9edb6456c15a6', 'KNSDC Super Monitor', 'monitor', true),
  ('d@knsdc.in', 'd56fff2322355f2f9090a421fbb6dc0acdce1679c3749d4694d1e5952c67e66f', 'tg', 'director', true),
  ('pert@knsdc.in', 'd56fff2322355f2f9090a421fbb6dc0acdce1679c3749d4694d1e5952c67e66f', 'lok', 'service_partner', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active;
"""

with open(sql_path, "a", encoding="utf-8") as f:
    f.write(extra_sql)

print("setup_new_supabase.sql updated successfully!")
