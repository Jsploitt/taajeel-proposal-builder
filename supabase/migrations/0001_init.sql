-- 0001_init.sql — Taajeel Proposal Builder, base schema.
--
-- Contract: src/compiler/types.ts.  `proposals.spec` stores a whole DeckSpec
-- verbatim as jsonb; every other table here is *input* the UI assembles a
-- DeckSpec from.  Nothing in this schema computes a fee, a duration, a date or
-- a reference number.
--
-- Two conventions that look wrong but are deliberate:
--   1. Money and durations that appear on a slide are `text`, not numeric/date.
--      They are rendered exactly as typed ("40,000", "5 December 2024",
--      "1" + "Month Salary Per Employee").  Parsing them would invite the app
--      to re-derive them, which the contract forbids.
--   2. NULL means UNCONFIRMED, never "confirmed empty".  The compiler renders
--      [TO BE CONFIRMED] for a missing required value.

begin;

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- client name search

-- ---------------------------------------------------------------- enums

do $$ begin
  create type public.engagement_type as enum ('project', 'retainer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.para_style as enum ('body', 'subhead', 'small', 'emphasis');
exception when duplicate_object then null; end $$;

comment on type public.engagement_type is
  'EngagementType in src/compiler/types.ts. Drives which deck sections appear.';
comment on type public.para_style is
  'ParaStyle in src/compiler/types.ts. Selects the style exemplar run in the template.';

-- ---------------------------------------------------------------- updated_at

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: stamps updated_at. Attached to every mutable table.';

-- ---------------------------------------------------------------- clients

create table if not exists public.clients (
  id                  uuid primary key default gen_random_uuid(),
  legal_name          text not null,
  display_name        text not null,
  legal_form          text,
  country             text,
  country_code        text,
  registration_label  text,
  registration_number text,
  incorporated_on     text,
  capital             text,
  activity            text,
  address             text,
  attention           text,
  mobile              text,
  email               text,
  web                 text,
  logo_path           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint clients_country_code_iso2
    check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

comment on table public.clients is
  'ClientRecord in src/compiler/types.ts, one row per client. Fields map 1:1 onto '
  'the bold runs of the About-the-Client paragraph (template/FORENSICS.md §3).';
comment on column public.clients.legal_name is
  'Full legal name as it must appear in the signoff and About-the-Client paragraph, '
  'e.g. "HAVENSTONE CONSULTING W.L.L". Cased as the client writes it.';
comment on column public.clients.display_name is
  'Cover treatment of the same name, e.g. "HAVENSTONE Consulting W.L.L".';
comment on column public.clients.country_code is
  'ISO 3166-1 alpha-2, uppercase. Selects the bundled flag artwork. '
  'NULL removes the flag shape rather than showing the wrong flag.';
comment on column public.clients.registration_label is
  'The label printed before registration_number. Observed values: '
  '"Commercial Registration No." (P1), "Unified National Number" (P2), '
  '"MISA License No." (P3). Not constrained — Taajeel may use others.';
comment on column public.clients.incorporated_on is
  'TEXT, not date. Rendered verbatim as the client supplied it ("5 December 2024"). '
  'Storing a date would force the app to choose a format, which the contract forbids.';
comment on column public.clients.capital is
  'TEXT including the currency as printed, e.g. "BHD 1,000". Never a number.';
comment on column public.clients.logo_path is
  'Path of an object in the "client-logos" Storage bucket (see 0003_storage.sql). '
  'One logo per client; the cover places it on a white plate. '
  'Not a foreign key — Storage objects are not referentially linked.';

create index if not exists clients_legal_name_trgm
  on public.clients using gin (lower(legal_name) gin_trgm_ops);
create index if not exists clients_display_name_trgm
  on public.clients using gin (lower(display_name) gin_trgm_ops);
create index if not exists clients_legal_name_lower
  on public.clients (lower(legal_name));

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- services

create table if not exists public.services (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  engagement_type     public.engagement_type not null,
  subject_template    text,
  service_description text,
  default_sections    jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint services_default_sections_is_object
    check (jsonb_typeof(default_sections) = 'object')
);

comment on table public.services is
  'One row per kind of engagement Taajeel sells. Supplies the defaults the UI '
  'pre-fills a new proposal with; the staff member may override any of them.';
comment on column public.services.subject_template is
  'Verbatim subject line from the source proposal, reused as-is for the letter and '
  'cover. Named "template" because it may contain a client-specific tail the staff '
  'member edits; it holds no substitution tokens today.';
comment on column public.services.service_description is
  'Engagement.serviceDescription: the tail of the letter opening sentence that '
  'follows the Arabic brand run "taajeel | تعجيل". Verbatim substring of the source letter.';
comment on column public.services.default_sections is
  'Section switches and section-level defaults for a DeckSpec, as observed in the '
  'source proposal. Keys mirror DeckSpec: timeFrame, additional, nonCovered, '
  'rateCard, govFees, fees. Deliberately contains NO fees.headline and NO '
  'engagement.referenceNumber — both are per-proposal inputs with no default.';

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- scope_steps

create table if not exists public.scope_steps (
  id                    uuid primary key default gen_random_uuid(),
  service_id            uuid not null references public.services(id) on delete cascade,
  ordinal               int  not null,
  label                 text not null,
  default_duration_days int,
  agency                text,
  block_ordinal         int  not null default 1,
  block_title           text,
  block_intro           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint scope_steps_ordinal_positive       check (ordinal > 0),
  constraint scope_steps_block_ordinal_positive check (block_ordinal > 0),
  constraint scope_steps_duration_positive
    check (default_duration_days is null or default_duration_days > 0),
  constraint scope_steps_agency_known check (
    agency is null or agency in (
      'misa', 'sbc', 'moc', 'notary', 'aamaly', 'qiwa', 'hrsd',
      'gosi', 'muqeem', 'national_address', 'zatca', 'riyadh_chamber'
    )
  ),
  constraint scope_steps_service_ordinal_unique unique (service_id, ordinal)
);

comment on table public.scope_steps is
  'ScopeStep rows for a service, in presentation order. Ordinal is unique and '
  'contiguous across the WHOLE service; block_ordinal groups them back into the '
  'ScopeBlock[] the compiler expects.';
comment on column public.scope_steps.ordinal is
  'Global 1-based position within the service. The journey graphic fills its label '
  'slots in this order and hides the slots beyond the step count.';
comment on column public.scope_steps.default_duration_days is
  'Time Frame only. NULL means UNCONFIRMED, not zero: the step renders with no '
  'duration chip. Never invented and never derived from the other steps.';
comment on column public.scope_steps.agency is
  'Government agency key from template/assets/agencies/index.json. Decides which '
  'agency mark is drawn beside this step. NULL removes the mark, which is correct; '
  'guessing shows the wrong government logo next to a step. Constrained to the '
  'twelve keys that exist in the index.';
comment on column public.scope_steps.block_ordinal is
  'Which ScopeBlock this step belongs to (1-based). DeckSpec.scope is ScopeBlock[]; '
  'P3 has two blocks, P1 and P2 have one. See README for the contract note.';
comment on column public.scope_steps.block_title is
  'ScopeBlock.title, e.g. "Setup the Company". Repeated on every step of the block; '
  'the app groups by block_ordinal and takes the first non-null.';
comment on column public.scope_steps.block_intro is
  'ScopeBlock.intro, verbatim from the source slide. Repeated like block_title.';

create index if not exists scope_steps_service_order
  on public.scope_steps (service_id, block_ordinal, ordinal);

drop trigger if exists scope_steps_set_updated_at on public.scope_steps;
create trigger scope_steps_set_updated_at
  before update on public.scope_steps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- boilerplate

create table if not exists public.boilerplate (
  id              uuid primary key default gen_random_uuid(),
  key             text not null unique,
  body            text not null,
  style           public.para_style not null default 'body',
  source_proposal text,
  verbatim        boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.boilerplate is
  'The snippet library the UI offers when composing the About-the-Client and '
  'notes blocks. Every row is prose that already exists in a sent proposal.';
comment on column public.boilerplate.key is
  'Stable machine key, e.g. "about_taajeel.narrative". Referenced by the UI, '
  'never shown to the reader.';
comment on column public.boilerplate.style is
  'ParaStyle applied when the snippet is dropped into a rich-text block. '
  'Picks the exemplar run whose formatting is cloned (see Fill.style_exemplars).';
comment on column public.boilerplate.source_proposal is
  'Which sent proposal this text was lifted from, e.g. "P1 Havenstone". '
  'Where the three proposals differ, this names the variant that was stored.';
comment on column public.boilerplate.verbatim is
  'TRUE = byte-for-byte from a sent proposal and must never be reworded, '
  'reflowed or translated on the way into a deck. FALSE = Taajeel-authored text '
  'that may be edited freely.';

drop trigger if exists boilerplate_set_updated_at on public.boilerplate;
create trigger boilerplate_set_updated_at
  before update on public.boilerplate
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- rate_card

create table if not exists public.rate_card (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  amount     text not null,
  unit       text,
  ordinal    int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.rate_card is
  'RateCardItem library — the "Taajeel Fees (Additional & Optional)" grid. Staff '
  'tick which items appear on a given proposal and may override the price for that '
  'proposal only; the override lives in proposals.spec, never here.';
comment on column public.rate_card.amount is
  'TEXT, rendered verbatim — "4,500", "18,000", "150", and "1" for the '
  'one-month-salary item. Never numeric: the deck prints grouped digits and the '
  'app must not re-derive or re-format them. Currency is SAR throughout the '
  'source deck and is drawn as a glyph by the template, so it is not stored here.';
comment on column public.rate_card.unit is
  'The qualifier printed under the amount, verbatim ("Per Bank", '
  '"Monthly subscriptions", "for every 250 words"). NULL = the source shows none.';
comment on column public.rate_card.ordinal is
  'Display order, matching the numbered badges on the source fees slide.';
comment on column public.rate_card.active is
  'FALSE retires an item from the picker without deleting it, so past proposals '
  'that referenced it still explain themselves.';

create index if not exists rate_card_active_order
  on public.rate_card (ordinal) where active;

drop trigger if exists rate_card_set_updated_at on public.rate_card;
create trigger rate_card_set_updated_at
  before update on public.rate_card
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- proposals

create table if not exists public.proposals (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  version    int  not null default 1,
  spec       jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,

  constraint proposals_version_positive check (version > 0),
  constraint proposals_spec_is_object   check (jsonb_typeof(spec) = 'object'),
  constraint proposals_family_version_unique unique (family_id, version)
);

comment on table public.proposals is
  'One row per rendered version of one proposal. Rows are append-only in spirit: '
  'a revision is a NEW row with the same family_id and version + 1, never an '
  'UPDATE, so v01/v02/v03 all survive.';
comment on column public.proposals.family_id is
  'Groups the versions of the same proposal. Defaulted to a fresh uuid, so v01 '
  'needs no special handling; v02 copies v01.family_id. Unique with version. '
  '(P2 was sent as v02 and P3 as V03 — versioning is real, not hypothetical.)';
comment on column public.proposals.service_id is
  'Nullable and ON DELETE SET NULL: the service catalogue may change, but a sent '
  'proposal must keep rendering. Everything needed to re-render is already in spec.';
comment on column public.proposals.spec is
  'The ENTIRE DeckSpec (src/compiler/types.ts), stored verbatim and never '
  'normalised into columns. This is the point of the table: re-rendering this row '
  'reproduces the sent deck byte-for-byte in content, even after the client record, '
  'the service defaults or the rate card have moved on. Treat as immutable. '
  'It also carries the values that have no default anywhere — engagement.letterDate '
  'and engagement.referenceNumber (scheme UNKNOWN, always typed in).';
comment on column public.proposals.created_by is
  'auth.users.id of the staff member who saved this version. Defaulted from '
  'auth.uid(); nulled rather than cascaded if the account is removed.';

create index if not exists proposals_client_recent
  on public.proposals (client_id, created_at desc);
create index if not exists proposals_service
  on public.proposals (service_id);
create index if not exists proposals_family
  on public.proposals (family_id, version desc);
create index if not exists proposals_spec_gin
  on public.proposals using gin (spec jsonb_path_ops);

commit;
