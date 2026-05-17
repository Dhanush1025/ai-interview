create extension if not exists vector;

create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  video_url text,
  content text,
  embedding vector(384)
);

-- Enable RLS
alter table knowledge_base enable row level security;

-- Allow anyone to read/write for now since it's a shared knowledge base
create policy "Allow public read knowledge_base"
  on knowledge_base for select
  using (true);

create policy "Allow public insert knowledge_base"
  on knowledge_base for insert
  with check (true);

-- Function to search the knowledge base
create or replace function match_knowledge_base (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  video_url text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.video_url,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
