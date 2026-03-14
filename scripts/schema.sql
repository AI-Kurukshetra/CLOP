-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('borrower','officer','admin')),
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- LOAN PRODUCTS
-- ─────────────────────────────────────────
create table loan_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (
    type in ('personal','home','auto','business','education')
  ),
  min_amount numeric not null,
  max_amount numeric not null,
  min_tenure_months int not null,
  max_tenure_months int not null,
  base_interest_rate numeric not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- LOAN APPLICATIONS
-- ─────────────────────────────────────────
create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid references profiles(id) not null,
  loan_product_id uuid references loan_products(id) not null,
  amount numeric not null,
  tenure_months int not null,
  purpose text not null,
  employment_status text not null check (
    employment_status in (
      'salaried','self_employed','business_owner','unemployed','student'
    )
  ),
  annual_income numeric not null,
  employer_name text,
  self_reported_credit_score int,
  existing_loans text,
  additional_notes text,
  status text not null default 'pending' check (
    status in (
      'pending','under_review','additional_info_required',
      'approved','rejected','disbursed','cancelled'
    )
  ),
  ai_decision text check (ai_decision in ('approve','manual_review','reject')),
  ai_confidence int,
  ai_reasoning text,
  ai_suggested_rate numeric,
  ai_risk_level text check (
    ai_risk_level in ('low','medium','high','very_high')
  ),
  ai_key_factors text[],
  ai_red_flags text[],
  officer_id uuid references profiles(id),
  officer_notes text,
  approved_amount numeric,
  approved_rate numeric,
  approved_tenure_months int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reviewed_at timestamptz,
  decision_at timestamptz
);

-- ─────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────
create table documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references loan_applications(id) not null,
  borrower_id uuid references profiles(id) not null,
  doc_type text not null check (
    doc_type in (
      'identity','income_proof','bank_statement',
      'address_proof','employment_letter','other'
    )
  ),
  file_name text not null,
  file_url text not null,
  file_size int,
  verified boolean default false,
  uploaded_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  application_id uuid references loan_applications(id),
  title text not null,
  message text not null,
  type text check (
    type in (
      'status_update','document_request','decision','reminder','general'
    )
  ),
  read boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references loan_applications(id),
  performed_by uuid references profiles(id),
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger loan_applications_updated_at
  before update on loan_applications
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table profiles enable row level security;
alter table loan_applications enable row level security;
alter table documents enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table loan_products enable row level security;

-- Profiles
create policy "users_manage_own_profile" on profiles
  for all using (auth.uid() = id);

create or replace function is_staff_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role in ('officer','admin')
  );
$$;

grant execute on function is_staff_user() to authenticated;

create policy "officers_view_all_profiles" on profiles
  for select using (is_staff_user());

-- Loan products (everyone can read)
create policy "anyone_reads_loan_products" on loan_products
  for select using (true);

-- Applications
create policy "borrowers_own_applications" on loan_applications
  for all using (
    auth.uid() = borrower_id or
    is_staff_user()
  );

-- Documents
create policy "documents_access" on documents
  for all using (
    auth.uid() = borrower_id or
    is_staff_user()
  );

-- Notifications (own only)
create policy "own_notifications" on notifications
  for all using (auth.uid() = user_id);

-- Audit logs (officers only)
create policy "officers_read_audit" on audit_logs
  for select using (is_staff_user());
