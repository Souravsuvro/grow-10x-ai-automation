create table if not exists clients (
  id serial primary key,
  slug text unique not null,
  business_name text not null,
  business_category text not null,
  audience text not null,
  locations text not null,
  brand_voice text not null,
  platforms text not null,
  created_at timestamptz not null default now()
);

create table if not exists content_items (
  id serial primary key,
  client_id integer not null references clients(id),
  campaign text not null default '',
  source_model text not null default 'intake',
  content_type text not null default 'text',
  topic text not null,
  raw_content text not null,
  summary text not null default '',
  status text not null default 'source',
  platform text not null default 'linkedin',
  audience text not null default '',
  location_target text not null default '',
  priority text not null default 'medium',
  approval_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists content_items_client_idx on content_items (client_id);
create index if not exists content_items_status_idx on content_items (status);

create table if not exists drafts (
  id serial primary key,
  content_id integer not null references content_items(id) on delete cascade,
  platform text not null,
  variant_label text not null,
  copy text not null,
  suggested_time text not null default '',
  seo_score integer not null default 0,
  recommended boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists drafts_content_idx on drafts (content_id);

create table if not exists schedule_slots (
  id serial primary key,
  draft_id integer not null references drafts(id) on delete cascade,
  client_id integer not null references clients(id),
  platform text not null,
  publish_at timestamptz not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create index if not exists schedule_slots_publish_idx on schedule_slots (publish_at);

create table if not exists image_assets (
  id serial primary key,
  client_id integer not null references clients(id),
  title text not null,
  caption text not null,
  page_path text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id serial primary key,
  event text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

insert into clients (slug, business_name, business_category, audience, locations, brand_voice, platforms)
select 'northline-dental', 'Northline Dental', 'Dental care', 'Working adults who delay checkups', 'Austin, TX', 'Calm, precise, reassuring', 'linkedin,instagram,facebook'
where not exists (select 1 from clients where slug = 'northline-dental');

insert into clients (slug, business_name, business_category, audience, locations, brand_voice, platforms)
select 'harbor-rye', 'Harbor & Rye', 'Neighborhood cafe', 'Weekend regulars and remote workers', 'Portland, OR', 'Warm, specific, a little wry', 'instagram,tiktok,facebook'
where not exists (select 1 from clients where slug = 'harbor-rye');

insert into clients (slug, business_name, business_category, audience, locations, brand_voice, platforms)
select 'lumen-field', 'Lumen Field Coaching', 'Fitness coaching', 'Young professionals training before work', 'London and New York', 'Direct, energetic, never shouty', 'instagram,linkedin,youtube'
where not exists (select 1 from clients where slug = 'lumen-field');

insert into content_items (client_id, campaign, source_model, content_type, topic, raw_content, summary, status, platform, audience, location_target, priority, approval_status)
select c.id, 'spring-checkups', 'intake', 'blog', 'Same-week cleanings',
  'Most new patients wait six weeks. Northline holds three same-week hygiene slots for people who have not been in over a year. The visit is 50 minutes, includes digital images, and the team explains every finding before anyone talks about treatment.',
  'Same-week hygiene for people who have been putting it off.',
  'drafted', 'linkedin', 'Working adults', 'Austin, TX', 'high', 'pending'
from clients c where c.slug = 'northline-dental'
and not exists (select 1 from content_items where topic = 'Same-week cleanings');

insert into content_items (client_id, campaign, source_model, content_type, topic, raw_content, summary, status, platform, audience, location_target, priority, approval_status)
select c.id, 'rainy-saturday', 'intake', 'text', 'Window seats on Division',
  'Harbor & Rye keeps the six window seats unreserved until 10am on Saturdays. Oat cortado, rye toast, and a playlist that stays under the conversation.',
  'Saturday morning window seats, reserved for nobody.',
  'approved', 'instagram', 'Neighborhood regulars', 'Portland, OR', 'medium', 'approved'
from clients c where c.slug = 'harbor-rye'
and not exists (select 1 from content_items where topic = 'Window seats on Division');

insert into drafts (content_id, platform, variant_label, copy, suggested_time, seo_score, recommended, notes)
select i.id, 'linkedin', 'A',
  'If it has been a year, you do not need a lecture. Northline Dental in Austin keeps three same-week hygiene slots open for people starting again. Fifty minutes. Digital images. A plain-language plan before anyone mentions treatment.',
  'Tue 08:15', 86, true, 'Location hook in the first line. No scare copy.'
from content_items i where i.topic = 'Same-week cleanings'
and not exists (select 1 from drafts d where d.content_id = i.id and d.variant_label = 'A');

insert into drafts (content_id, platform, variant_label, copy, suggested_time, seo_score, recommended, notes)
select i.id, 'instagram', 'A',
  'The six window seats on Division stay open until 10 on Saturdays. Oat cortado. Rye toast. No reservation theater.',
  'Sat 09:05', 78, true, 'Short caption. Location in the first clause.'
from content_items i where i.topic = 'Window seats on Division'
and not exists (select 1 from drafts d where d.content_id = i.id and d.variant_label = 'A');

insert into image_assets (client_id, title, caption, page_path, image_path)
select c.id, 'Northline reception light', 'Morning light in the Austin treatment corridor', '/clients/northline-dental', '/media/northline.svg'
from clients c where c.slug = 'northline-dental'
and not exists (select 1 from image_assets where image_path = '/media/northline.svg');

insert into image_assets (client_id, title, caption, page_path, image_path)
select c.id, 'Harbor window', 'Saturday window seats on Division', '/clients/harbor-rye', '/media/harbor.svg'
from clients c where c.slug = 'harbor-rye'
and not exists (select 1 from image_assets where image_path = '/media/harbor.svg');

insert into image_assets (client_id, title, caption, page_path, image_path)
select c.id, 'Lumen dawn session', 'Pre-work coaching block in London', '/clients/lumen-field', '/media/lumen.svg'
from clients c where c.slug = 'lumen-field'
and not exists (select 1 from image_assets where image_path = '/media/lumen.svg');

insert into activity_logs (event, detail)
select 'seed', 'Workspace loaded with three sample studios'
where not exists (select 1 from activity_logs where event = 'seed');
