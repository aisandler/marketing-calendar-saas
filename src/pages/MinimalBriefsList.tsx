import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const MinimalBriefsList = () => {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [columnNames, setColumnNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        
        // First check what columns are available
        const { data: columnsData, error: columnsError } = await supabase.rpc(
          'debug_briefs_columns'
        );
        
        if (columnsError) {
          // If the RPC doesn't exist, just continue
          console.log('RPC not available:', columnsError);
        } else {
          setColumnNames(columnsData || []);
        }

        // Try with *
        console.log('Trying with * selector');
        const { data: allData, error: allError } = await supabase
          .from('briefs')
          .select('*')
          .limit(5);
          
        if (allError) {
          console.error('Error with * selector:', allError);
          
          // Try with fewer columns
          console.log('Trying with minimal columns');
          const { data: minimalData, error: minimalError } = await supabase
            .from('briefs')
            .select('id, title')
            .limit(5);
            
          if (minimalError) {
            console.error('Error with minimal selector:', minimalError);
            setError(`Failed to fetch briefs: ${minimalError.message}`);
          } else {
            setBriefs(minimalData || []);
            if (minimalData && minimalData.length > 0) {
              setColumnNames(Object.keys(minimalData[0]));
            }
          }
        } else {
          setBriefs(allData || []);
          if (allData && allData.length > 0) {
            setColumnNames(Object.keys(allData[0]));
          }
        }
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBriefs();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Minimal Briefs List</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Available Columns</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          {columnNames.length > 0 ? (
            <ul className="list-disc pl-6">
              {columnNames.map((col, i) => (
                <li key={i}>{col}</li>
              ))}
            </ul>
          ) : (
            <p>No columns detected</p>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Briefs ({briefs.length})</h2>
        {briefs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnNames.map((col, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {briefs.map((brief, i) => (
                  <tr key={i}>
                    {columnNames.map((col, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof brief[col] === 'object' ? 
                          JSON.stringify(brief[col]) : 
                          String(brief[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No briefs found</p>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-semibold mb-2">SQL Fix Recommendations</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="mb-2">Try running these SQL statements:</p>
          <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto text-sm">
{`-- 1. Check if table exists and has data
SELECT COUNT(*) FROM briefs;

-- 2. Disable RLS temporarily to check for permission issues
ALTER TABLE briefs DISABLE ROW LEVEL SECURITY;

-- 3. Try a simple query with all columns
SELECT * FROM briefs LIMIT 1;

-- 4. Check for duplicated columns (case sensitivity issues)
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'briefs'
ORDER BY column_name;`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MinimalBriefsList;