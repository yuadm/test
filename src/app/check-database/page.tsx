'use client';

import { useState, useEffect } from 'react';
import { checkExpectedTables } from '@/lib/utils/check-database';

export default function CheckDatabase() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkDatabase() {
      try {
        setLoading(true);
        const dbResults = await checkExpectedTables();
        setResults(dbResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred checking the database');
      } finally {
        setLoading(false);
      }
    }

    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Database Structure Check</h1>
        
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {results && (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Database Tables Summary</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of all expected tables in your Supabase database.</p>
              </div>
              
              <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Row Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(results).map(([tableName, tableInfo]: [string, any]) => (
                      <tr key={tableName} className={tableInfo.exists ? '' : 'bg-red-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tableName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tableInfo.exists ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Exists
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tableInfo.rowCount !== undefined ? tableInfo.rowCount : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                          {tableInfo.error || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Sample Data</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">First row from each table (if available)</p>
              </div>
              
              <div className="border-t border-gray-200">
                <dl>
                  {Object.entries(results).map(([tableName, tableInfo]: [string, any]) => (
                    <div key={`sample-${tableName}`} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">{tableName}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {tableInfo.sample ? (
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(tableInfo.sample, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-gray-500 italic">No data available</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Database Setup Instructions</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Follow these steps if tables are missing</p>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to your Supabase dashboard: <a href="https://app.supabase.io/projects" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://app.supabase.io/projects</a></li>
                  <li>Navigate to the "SQL Editor" section in the left sidebar</li>
                  <li>Click "New Query"</li>
                  <li>Copy and paste the SQL from the <code>supabase.schema.sql</code> file</li>
                  <li>Click "Run" to execute the SQL and create all the necessary tables</li>
                  <li>Go to "Authentication" → "Users" and create the users:
                    <ul className="list-disc pl-5 mt-2">
                      <li>admin@example.com / password123</li>
                      <li>user@example.com / password123</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
