-- Establish an explicit tenant owner for workspace roots.
-- Existing seeded/demo records remain visible only to the documented dev user;
-- production users must be explicitly assigned their own data during rollout.
alter table clients add column if not exists owner_id text;
update clients set owner_id = 'dev-user' where owner_id is null;
alter table clients alter column owner_id set not null;
create index if not exists clients_owner_idx on clients (owner_id);

alter table activity_logs add column if not exists owner_id text;
update activity_logs set owner_id = 'dev-user' where owner_id is null;
alter table activity_logs alter column owner_id set not null;
create index if not exists activity_logs_owner_idx on activity_logs (owner_id, id desc);

alter table chat_threads add column if not exists owner_id text;
update chat_threads set owner_id = 'dev-user' where owner_id is null;
alter table chat_threads alter column owner_id set not null;
create index if not exists chat_threads_owner_idx on chat_threads (owner_id, id desc);

-- chat_threads uses text identifiers; generate an opaque ID when creating a thread.
alter table chat_threads alter column id set default gen_random_uuid()::text;
