-- Optional. Run this only after your row exists and your passphrase is entered
-- on every device you use. It removes the ability to create new rows; reading
-- and updating the existing row with a matching passphrase keeps working.

drop policy if exists "create own row" on public.tracker_state;
