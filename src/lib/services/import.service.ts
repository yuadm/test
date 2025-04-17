import { Employee, Branch } from '@/types';
import { EmployeeService } from './employee.service';
import { BranchService } from './branch.service';
import { LeaveService } from './leave.service';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const ImportService = {
  // Parse CSV file
  parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  },

  // Parse Excel file
  parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  },

  // Get required columns for import
  getRequiredColumns(): string[] {
    return ['name', 'employee_number', 'job_title', 'branch', 'is_active', 'remaining_days'];
  },

  // Process and validate imported data
  async processImportedData(data: any[]): Promise<{
    valid: any[];
    invalid: any[];
    errors: Record<number, string>;
  }> {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors: Record<number, string> = {};

    // Get all branches for validation
    const { data: branches } = await BranchService.getAllBranches();
    const branchMap = new Map<string, Branch>();
    
    if (branches) {
      branches.forEach((branch: Branch) => {
        // Store both uppercase and original version for case-insensitive matching
        branchMap.set(branch.name.toUpperCase(), branch);
      });
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check if name is provided (required field)
      if (!row.name) {
        invalid.push(row);
        errors[i] = 'Name is required';
        continue;
      }

      // Process branch (case insensitive matching)
      let branchId = null;
      if (row.branch) {
        const branchUppercase = row.branch.toUpperCase();
        const branch = branchMap.get(branchUppercase);
        
        if (branch) {
          branchId = branch.id;
        }
      }
      
      // If branch is not found or not provided, find or create an "Unassigned" branch
      if (!branchId) {
        // Look for an "Unassigned" branch
        const unassignedBranch = branches?.find(b => b.name.toUpperCase() === 'UNASSIGNED');
        
        if (unassignedBranch) {
          branchId = unassignedBranch.id;
        } else {
          // If no "Unassigned" branch exists, use the first available branch
          // This is a fallback to prevent null branch_id
          branchId = branches && branches.length > 0 ? branches[0].id : undefined;
        }
      }

      // Process remaining_days
      let remainingDays = 28; // Default value
      let daysTaken = 0;
      
      if (row.remaining_days !== undefined && row.remaining_days !== '') {
        const parsedDays = parseInt(row.remaining_days, 10);
        if (!isNaN(parsedDays)) {
          remainingDays = parsedDays;
          daysTaken = 28 - remainingDays;
        }
      }

      // Create processed employee object
      const processedEmployee = {
        full_name: row.name,
        employee_code: row.employee_number || '',
        job_title: row.job_title || '',
        branch_id: branchId,
        is_active: row.is_active === 'true' || row.is_active === true || row.is_active === undefined || row.is_active === '',
        remaining_days: remainingDays,
        days_taken: daysTaken
      };

      valid.push(processedEmployee);
    }

    return { valid, invalid, errors };
  },

  // Import employees from processed data
  async importEmployees(processedData: any[]): Promise<{
    success: number;
    failed: number;
    errors: Record<string, string>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: {} as Record<string, string>
    };

    // Get the current leave year
    const { data: leaveYear } = await LeaveService.getCurrentLeaveYear();
    
    if (!leaveYear) {
      throw new Error('Failed to get current leave year');
    }

    const supabase = createClient();

    // Process each employee
    for (const employee of processedData) {
      try {
        // Create the employee
        const { data, error } = await EmployeeService.createEmployee({
          full_name: employee.full_name,
          employee_code: employee.employee_code,
          job_title: employee.job_title,
          branch_id: employee.branch_id,
          is_active: employee.is_active
        });

        if (error || !data) {
          results.failed++;
          results.errors[employee.full_name] = error || 'Failed to create employee';
          continue;
        }

        // Calculate remaining days and days taken
        const remainingDays = employee.remaining_days !== undefined ? 
          parseInt(employee.remaining_days.toString(), 10) : 28;
        const daysTaken = 28 - remainingDays;
        
        // Update the employee record with the calculated values
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            days_taken: daysTaken,
            days_remaining: remainingDays
          } as Partial<Employee>)
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating days for employee:', updateError.message);
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors[employee.full_name] = error.message || 'Unknown error';
      }
    }

    return results;
  }
};
