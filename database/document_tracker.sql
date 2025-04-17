-- Drop the existing document_tracker table if it exists
DROP TABLE IF EXISTS document_tracker;

-- Create the document_tracker table with the updated structure
CREATE TABLE document_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    employee_name TEXT NOT NULL, 
    branch TEXT,
    status TEXT NOT NULL,
    country TEXT,
    passport_expiry TEXT, 
    brp_expiry TEXT, 
    right_to_work_expiry TEXT, 
    other_document_type TEXT,
    other_document_expiry TEXT, 
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on employee_id for faster lookups
CREATE INDEX document_tracker_employee_id_idx ON document_tracker(employee_id);

-- Create an index on employee_name for faster text searches
CREATE INDEX document_tracker_employee_name_idx ON document_tracker(employee_name);

-- Create an index on branch for faster lookups
CREATE INDEX document_tracker_branch_idx ON document_tracker(branch);

-- Comment: This table structure allows storing multiple document types for each employee in a single row.
-- The expiry date fields can contain either a date in ISO format (YYYY-MM-DD) or the string 'N/A'.
-- The employee_name field stores the employee's full name for easier querying without joins.
