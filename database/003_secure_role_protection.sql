-- CivicPulse AI Migration 003: Role Protection & Security Hardening
-- Prevents unauthorized privilege escalation on public.profiles

-- 1. Create a security definer trigger function to lock down role modification
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changing role column from standard authenticated or anon client requests
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only postgres / service_role triggers are permitted to elevate role
        IF current_user IN ('authenticated', 'anon') THEN
            -- Retain the previous role
            NEW.role := OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to profiles table
DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role();

-- 3. Update profiles UPDATE policy to explicitly prevent role modification by normal users
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Ensure admin users can view all profiles for management if needed
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );
