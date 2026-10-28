create table if not exists assist_runs (
  id serial primary key,
  client_id integer not null references clients(id),
  desk text not null,
  lane text not null,
  prompt text not null,
  result text not null default '',
  media_url text not null default '',
  media_kind text not null default '',
  job_id text not null default '',
  status text not null default 'ready',
  created_at timestamptz not null default now()
);

create index if not exists assist_runs_client_idx on assist_runs (client_id);
