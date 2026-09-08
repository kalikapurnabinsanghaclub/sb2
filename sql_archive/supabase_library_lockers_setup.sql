-- ==========================================================
-- KALIKAPUR NABIN SANGHA CLUB (KNSDC) - FINANCE PORTAL
-- 📚 LIBRARY & 🔒 LOCKERS DEDICATED DATABASE TABLES
-- ==========================================================

-- 1. Member Locker Allocations Table
CREATE TABLE IF NOT EXISTS public.locker_bookings (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    asset_code TEXT,
    category TEXT DEFAULT 'Locker',
    member_name TEXT NOT NULL,
    member_phone TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    rent_amount NUMERIC(10,2) DEFAULT 0,
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Library Books Catalog Table
CREATE TABLE IF NOT EXISTS public.library_books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    code TEXT,
    category TEXT DEFAULT 'General',
    total_copies INT DEFAULT 1,
    fee NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Library Circulation & Issues Table
CREATE TABLE IF NOT EXISTS public.library_issues (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    book_title TEXT NOT NULL,
    book_code TEXT,
    author TEXT,
    category TEXT,
    member_name TEXT NOT NULL,
    member_phone TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    returned_date DATE,
    fee NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Grant Full Access
ALTER TABLE public.locker_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all locker_bookings" ON public.locker_bookings;
DROP POLICY IF EXISTS "Allow all library_books" ON public.library_books;
DROP POLICY IF EXISTS "Allow all library_issues" ON public.library_issues;

CREATE POLICY "Allow all locker_bookings" ON public.locker_bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all library_books" ON public.library_books FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all library_issues" ON public.library_issues FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
