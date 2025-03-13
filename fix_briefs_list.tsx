import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Simple component to help diagnose the issue
const DiagnoseBriefs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [briefsData, setBriefsData] = useState([]);
  const [briefsColumns, setBriefsColumns] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First try to get the column information
        const { data: columnsData, error: columnsError } = await supabase
          .from('briefs')
          .select('*')
          .limit(0);

        if (columnsError) {
          setError(`Column info error: ${columnsError.message}`);
          return;
        }

        // Get columns from the response
        if (columnsData) {
          const columns = columnsData.length > 0 
            ? Object.keys(columnsData[0]) 
            : ['No columns found'];
          setBriefsColumns(columns);
        }

        // Try a minimal select that should work
        const { data, error } = await supabase
          .from('briefs')
          .select('id, title')
          .limit(5);

        if (error) {
          setError(`Basic query error: ${error.message}`);
          return;
        }

        setBriefsData(data || []);
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Database Diagnostics</h1>
      
      {error && (
        <div style={{ backgroundColor: '#fee', padding: '10px', border: '1px solid #f99', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Briefs Table Columns</h2>
        <pre>{JSON.stringify(briefsColumns, null, 2)}</pre>
      </div>
      
      <div>
        <h2>Sample Brief Data</h2>
        <pre>{JSON.stringify(briefsData, null, 2)}</pre>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>SQL Fix Instructions</h3>
        <p>Run the following SQL command in your Supabase SQL editor or via the CLI:</p>
        <pre style={{ backgroundColor: '#eee', padding: '10px' }}>
          {`-- First make sure we have a default brand
INSERT INTO brands (name, description, created_at)
SELECT 'Default Brand', 'Default brand for migration purposes', NOW()
WHERE NOT EXISTS (SELECT 1 FROM brands LIMIT 1);

-- Add missing columns
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- Update existing rows with default brand ID
UPDATE briefs SET brand_id = (SELECT id FROM brands ORDER BY created_at LIMIT 1)
WHERE brand_id IS NULL;`}
        </pre>
      </div>
    </div>
  );
};

export default DiagnoseBriefs;