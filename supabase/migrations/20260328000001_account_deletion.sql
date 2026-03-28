-- Create RPC function for atomic account deletion
-- Deletes all user data: clients, jobs, invoices, invites
-- Unlinks workers (sets owner_id to NULL)
-- Quotes and booking_requests are auto-deleted by CASCADE rules
-- Finally deletes the profile record

CREATE OR REPLACE FUNCTION delete_account_data(user_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_workers uuid[];
  result json;
BEGIN
  -- Collect workers before unlinking them
  SELECT ARRAY_AGG(id) INTO deleted_workers
  FROM profiles
  WHERE owner_id = user_id_input AND role = 'worker';

  -- Delete invites where this user is the admin
  DELETE FROM invites WHERE admin_id = user_id_input;

  -- Delete clients (no cascade, must delete explicitly)
  DELETE FROM "Clients" WHERE user_id = user_id_input;

  -- Delete jobs (no cascade, must delete explicitly)
  DELETE FROM "Jobs" WHERE user_id = user_id_input;

  -- Delete invoices (no cascade, must delete explicitly)
  DELETE FROM "Invoices" WHERE user_id = user_id_input;

  -- Quotes and booking_requests will be auto-deleted by CASCADE rules
  -- when we delete the auth user, but we can also delete them here explicitly
  DELETE FROM "Quotes" WHERE user_id = user_id_input;
  DELETE FROM booking_requests WHERE owner_id = user_id_input;

  -- Unlink all workers (set owner_id to NULL, they become independent)
  UPDATE profiles
  SET owner_id = NULL, admin_deleted_at = now()
  WHERE owner_id = user_id_input;

  -- Mark profile as deleted and clear sensitive data
  UPDATE profiles
  SET
    deleted_at = now(),
    phone = NULL,
    address = NULL,
    booking_username = NULL,
    business_name = NULL,
    google_review_link = NULL,
    booking_welcome_message = NULL
  WHERE id = user_id_input;

  -- Delete the profile record itself
  DELETE FROM profiles WHERE id = user_id_input;

  -- Return success with list of unlinked workers
  result := json_build_object(
    'success', true,
    'deleted_at', now(),
    'unlinked_workers', deleted_workers
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', sqlstate
  );
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_account_data(uuid) TO authenticated;
