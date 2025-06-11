-- Create a function to execute arbitrary SQL
-- This function requires superuser privileges
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
