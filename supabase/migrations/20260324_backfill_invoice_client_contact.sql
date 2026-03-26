-- Backfill client_email and client_phone on existing invoices
-- Joins against Clients table using the client_id already stored on each invoice

UPDATE "Invoices" i
SET
  client_email = c.email,
  client_phone = c.phone
FROM "Clients" c
WHERE i.client_id = c.id
  AND (i.client_email IS NULL AND i.client_phone IS NULL);
