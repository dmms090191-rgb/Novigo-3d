/*
  # Add default UUID generation for admins table
  
  1. Changes
    - Add default value gen_random_uuid() to the id column of admins table
    - This allows inserting new admins without explicitly providing an id
*/

ALTER TABLE admins ALTER COLUMN id SET DEFAULT gen_random_uuid();