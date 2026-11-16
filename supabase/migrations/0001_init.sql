-- =====================================================================
-- Outfit-App – Datenbank-Schema Version 1
-- Ausführen im Supabase-Dashboard: SQL Editor → New query → einfügen → Run
-- =====================================================================

-- ---------- Kleidungsstücke ----------
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  -- text + check statt enum: neue Werte lassen sich später leicht ergänzen
  category        text not null check (category in ('top', 'bottom', 'shoes', 'jacket', 'accessory')),
  accessory_type  text check (accessory_type in ('necklace', 'ring', 'bracelet', 'watch')),
  is_core         boolean not null default false,
  color_primary   text not null,
  color_secondary text,
  warmth          text not null check (warmth in ('light', 'medium', 'warm')),
  occasions       text[] not null check (
                    cardinality(occasions) >= 1
                    and occasions <@ array['uni', 'leisure', 'going_out', 'sport']
                  ),
  photo_path      text,
  available       boolean not null default true,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Art nur bei Accessoires, und dort Pflicht
  constraint accessory_type_only_for_accessories
    check ((category = 'accessory') = (accessory_type is not null))
);

create index items_user_idx on public.items (user_id);

-- updated_at automatisch setzen
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ---------- Getragene Outfits ----------
create table public.outfits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  worn_on    date not null,
  temp_band  text not null check (temp_band in ('frost', 'cold', 'cool', 'mild', 'warm', 'hot')),
  occasion   text not null check (occasion in ('uni', 'leisure', 'going_out', 'sport')),
  created_at timestamptz not null default now()
);

create index outfits_user_worn_idx on public.outfits (user_id, worn_on desc);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  item_id   uuid not null references public.items (id) on delete cascade,
  slot      text not null check (slot in ('top', 'bottom', 'shoes', 'jacket', 'accessory')),
  primary key (outfit_id, item_id)
);

create index outfit_items_item_idx on public.outfit_items (item_id);

-- ---------- Row Level Security: jede Zeile gehört genau einem Nutzer ----------
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;

create policy "items: nur eigene" on public.items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "outfits: nur eigene" on public.outfits
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- outfit_items hat keine user_id; Zugriff über das zugehörige Outfit UND das Teil
create policy "outfit_items: nur eigene" on public.outfit_items
  for all to authenticated
  using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid()))
  with check (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = auth.uid())
  );

-- ---------- Foto-Speicher: privater Bucket, jeder Nutzer nur im eigenen Ordner ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 2097152, array['image/jpeg']);

create policy "fotos: eigene lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: eigene hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: eigene ändern" on storage.objects
  for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: eigene löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
