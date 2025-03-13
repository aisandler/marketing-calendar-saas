import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const MinimalBriefsList = () => {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get debug information first
        const { data: debugData, error: debugError } = await supabase.rpc(
          'debug_briefs_data'
        );
        
        if (debugError) {
          console.error('Debug function error:', debugError);
          setDebugInfo({
            error: debugError.message,
            hint: 'Debug function not accessible'
          });
        } else {
          setDebugInfo(debugData);
          if (debugData.columns) {
            setColumnNames(debugData.columns.map((col: any) => col.name));
          }
        }

        // Fetch briefs data
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*');
          
        if (briefsError) {
          console.error('Error fetching briefs:', briefsError);
          setError(`Failed to fetch briefs: ${briefsError.message}`);
          setBriefs([]);
        } else {
          setBriefs(briefsData || []);
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
  
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Minimal Briefs List</h1>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
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
      
      <div className="mb-6">
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
      
      {debugInfo && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalBriefsList;