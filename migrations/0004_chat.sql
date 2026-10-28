create table if not exists chat_threads (
  id text primary key,
  title text not null default 'Desk',
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id serial primary key,
  thread_id text not null references chat_threads(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on chat_messages (thread_id, id);
