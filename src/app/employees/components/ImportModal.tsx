import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImportService } from '@/lib/services/import.service';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'excel' | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Record<string, string>;
  } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'results'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Required columns
  const requiredColumns = ImportService.getRequiredColumns();

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setError(null);
    setFile(selectedFile);
    
    // Determine file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') {
      setFileType('csv');
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      setFileType('excel');
    } else {
      setError('Unsupported file type. Please upload a CSV or Excel file.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Parse file based on type
      let parsedData;
      if (fileExtension === 'csv') {
        parsedData = await ImportService.parseCSVFile(selectedFile);
      } else {
        parsedData = await ImportService.parseExcelFile(selectedFile);
      }
      
      // Validate data has required columns
      const headers = Object.keys(parsedData[0] || {}).map(h => h.toLowerCase());
      
      // Check if name column exists (the only required column)
      if (!headers.includes('name')) {
        setError('The file must contain a "name" column.');
        setFile(null);
        setFileType(null);
        return;
      }
      
      setPreviewData(parsedData);
      setStep('preview');
    } catch (err: any) {
      setError(`Error parsing file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    noClick: false,
    noKeyboard: false
  });
  
  // Function to manually trigger file input click
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (!previewData) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Process and validate imported data
      const { valid, invalid, errors } = await ImportService.processImportedData(previewData);
      
      if (valid.length === 0) {
        setError('No valid data to import.');
        return;
      }
      
      // Import valid employees
      const results = await ImportService.importEmployees(valid);
      setImportResults(results);
      setStep('results');
      
      // If successful, refresh the employee list
      if (results.success > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    setFile(null);
    setFileType(null);
    setPreviewData(null);
    setError(null);
    setImportResults(null);
    setStep('upload');
    onClose();
  };
  
  // Handle back button
  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
      setPreviewData(null);
    } else if (step === 'results') {
      setStep('preview');
      setImportResults(null);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {step === 'upload' && 'Import Employees'}
            {step === 'preview' && 'Preview Data'}
            {step === 'results' && 'Import Results'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Upload step */}
        {step === 'upload' && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Upload a CSV or Excel file with employee data. The file must contain at least the following column:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-2 ml-4">
                <li><strong>name</strong> (required)</li>
                <li>employee_number</li>
                <li>job_title</li>
                <li>branch</li>
                <li>is_active</li>
                <li>remaining_days</li>
              </ul>
              <p className="text-sm text-gray-600">
                If branch is blank, employees will be assigned to "Unassigned". Branch names are case-insensitive.
                If remaining_days is empty, it will default to 28.
              </p>
            </div>
            
            <div 
              {...getRootProps()} 
              onClick={openFileDialog}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? 'Drop the file here' : 'Drag and drop a file here, or click to select a file'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
              
              {file && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md inline-block">
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Preview step */}
        {step === 'preview' && previewData && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Preview of the data to be imported. Please review before proceeding.
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    {previewData[0] && Object.keys(previewData[0]).map((header, index) => (
                      <th 
                        key={index} 
                        className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${
                          header.toLowerCase() === 'name' ? 'bg-yellow-50' : ''
                        }`}
                      >
                        {header}
                        {header.toLowerCase() === 'name' && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {previewData.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(previewData[0]).map((header, cellIndex) => (
                        <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                          {row[header] !== undefined && row[header] !== null ? row[header].toString() : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.length > 10 && (
              <p className="mt-2 text-xs text-gray-500">
                Showing 10 of {previewData.length} rows
              </p>
            )}
          </div>
        )}
        
        {/* Results step */}
        {step === 'results' && importResults && (
          <div>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="text-base font-medium text-gray-900 mb-2">Import Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Successfully imported:</p>
                  <p className="text-lg font-medium text-green-600">{importResults.success}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed to import:</p>
                  <p className="text-lg font-medium text-red-600">{importResults.failed}</p>
                </div>
              </div>
            </div>
            
            {importResults.failed > 0 && Object.keys(importResults.errors).length > 0 && (
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">Errors</h4>
                <div className="bg-red-50 rounded-md p-4">
                  <ul className="list-disc list-inside text-sm text-red-800">
                    {Object.entries(importResults.errors).map(([name, error], index) => (
                      <li key={index}>
                        <span className="font-medium">{name}</span>: {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          {step !== 'upload' && (
            <button
              onClick={handleBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              disabled={isLoading}
            >
              Back
            </button>
          )}
          
          <button
            onClick={handleCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
            disabled={isLoading}
          >
            {step === 'results' ? 'Close' : 'Cancel'}
          </button>
          
          {step === 'upload' && file && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              disabled={isLoading}
            >
              Change File
            </button>
          )}
          
          {step === 'preview' && (
            <button
              onClick={handleImport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Importing...
                </div>
              ) : (
                'Import Data'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
