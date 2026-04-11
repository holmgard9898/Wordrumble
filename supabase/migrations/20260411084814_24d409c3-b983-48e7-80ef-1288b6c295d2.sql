ALTER TABLE public.profiles ADD COLUMN coins integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN unlocked_items jsonb NOT NULL DEFAULT '[]'::jsonb;