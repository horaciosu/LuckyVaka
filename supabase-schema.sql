-- ============================================================
-- Lucky Vacations — Database Schema
-- Paste this in Supabase → SQL Editor → Run
-- ============================================================

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  country text,
  lang text default 'en',
  created_at timestamp with time zone default now()
);

-- Properties
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id),
  title text not null,
  title_es text,
  location text not null,
  description text,
  description_es text,
  beds int,
  baths int,
  guests int,
  amenities text[],
  emoji text,
  gradient text,
  status text default 'pending', -- pending | approved | rejected
  created_at timestamp with time zone default now()
);

-- Raffles
create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id),
  slug text unique not null,
  ticket_price numeric not null,
  total_tickets int not null,
  tickets_sold int default 0,
  min_tickets int not null,
  stay_value numeric,
  draw_date date not null,
  stay_date date not null,
  status text default 'draft', -- draft | active | completed | cancelled
  winner_ticket int,
  winner_user_id uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Tickets
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid references public.raffles(id),
  user_id uuid references public.profiles(id),
  ticket_numbers int[],
  quantity int not null,
  amount_paid numeric not null,
  payment_status text default 'pending', -- pending | paid | refunded
  stripe_payment_id text,
  created_at timestamp with time zone default now()
);

-- Transactions (audit trail)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id),
  user_id uuid references public.profiles(id),
  raffle_id uuid references public.raffles(id),
  amount numeric not null,
  type text not null, -- purchase | refund | payout
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.raffles enable row level security;
alter table public.tickets enable row level security;
alter table public.transactions enable row level security;

-- Anyone can read active raffles and properties
create policy "Public raffles are viewable by everyone"
  on public.raffles for select using (status = 'active' or status = 'completed');

create policy "Public properties are viewable by everyone"
  on public.properties for select using (status = 'approved');

-- Users can only see their own tickets
create policy "Users can view own tickets"
  on public.tickets for select using (auth.uid() = user_id);

create policy "Users can insert own tickets"
  on public.tickets for insert with check (auth.uid() = user_id);

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
