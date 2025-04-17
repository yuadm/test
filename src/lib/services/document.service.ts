import { createClient } from '@/lib/supabase/client';
import { ApiResponse } from '@/types';
import { Database } from '@/types/supabase';

export type DocumentFormData = Database['public']['Tables']['document_tracker']['Insert'];

export const DocumentService = {
  // Get document by ID
  async getDocumentById(id: string): Promise<ApiResponse<any>> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('document_tracker')
        .select(`*`)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching document by ID:', error);
      return { error: error.message };
    }
  },
  
  // Get all documents
  async getDocuments(): Promise<ApiResponse<any[]>> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('document_tracker')
        .select(`*, employees:employee_id (full_name, employee_code, branch_id)`)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      return { error: error.message };
    }
  },
  
  // Get documents by filter
  async getDocumentsByFilter(filter: string): Promise<ApiResponse<any[]>> {
    try {
      const supabase = createClient();
      let query = supabase
        .from('document_tracker')
        .select(`*, employees:employee_id (full_name, employee_code, branch_id)`);
      
      const today = new Date().toISOString().split('T')[0];
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const in30DaysStr = in30Days.toISOString().split('T')[0];
      
      const in90Days = new Date();
      in90Days.setDate(in90Days.getDate() + 90);
      const in90DaysStr = in90Days.toISOString().split('T')[0];
      
      // Complex filtering for documents with any expiry date matching the criteria
      switch (filter) {
        case 'expired':
          query = query.or(
            `passport_expiry.lt.${today},brp_expiry.lt.${today},right_to_work_expiry.lt.${today},other_document_expiry.lt.${today}`
          );
          break;
        case 'expiring30':
          query = query.or(
            `passport_expiry.gte.${today},brp_expiry.gte.${today},right_to_work_expiry.gte.${today},other_document_expiry.gte.${today}`
          ).or(
            `passport_expiry.lte.${in30DaysStr},brp_expiry.lte.${in30DaysStr},right_to_work_expiry.lte.${in30DaysStr},other_document_expiry.lte.${in30DaysStr}`
          );
          break;
        case 'expiring90':
          query = query.or(
            `passport_expiry.gte.${today},brp_expiry.gte.${today},right_to_work_expiry.gte.${today},other_document_expiry.gte.${today}`
          ).or(
            `passport_expiry.lte.${in90DaysStr},brp_expiry.lte.${in90DaysStr},right_to_work_expiry.lte.${in90DaysStr},other_document_expiry.lte.${in90DaysStr}`
          );
          break;
        case 'valid':
          query = query.or(
            `passport_expiry.gt.${today},brp_expiry.gt.${today},right_to_work_expiry.gt.${today},other_document_expiry.gt.${today}`
          );
          break;
      }
      
      // Order by most recent first
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { data };
    } catch (error: any) {
      console.error('Error fetching documents by filter:', error);
      return { error: error.message };
    }
  },
  
  // Create or update a document record for an employee
  async saveDocument(documentData: DocumentFormData): Promise<ApiResponse<any>> {
    try {
      const supabase = createClient();
      
      // Check if a record already exists for this employee
      const { data: existingData, error: checkError } = await supabase
        .from('document_tracker')
        .select('id')
        .eq('employee_id', documentData.employee_id)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      let result;
      
      if (existingData?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('document_tracker')
          .update({
            ...documentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select();
        
        if (error) {
          throw new Error(error.message);
        }
        
        result = { data: data[0] };
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('document_tracker')
          .insert({
            ...documentData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          throw new Error(error.message);
        }
        
        result = { data: data[0] };
      }
      
      return result;
    } catch (error: any) {
      console.error('Error saving document:', error);
      return { error: error.message };
    }
  },
  
  // Delete a document
  async deleteDocument(id: string): Promise<ApiResponse<any>> {
    try {
      const supabase = createClient();
      
      // Only delete from document_tracker table, not from employees table
      const { data, error } = await supabase
        .from('document_tracker')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { data };
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return { error: error.message };
    }
  },
  
  // Batch delete documents
  async batchDeleteDocuments(ids: string[]): Promise<ApiResponse<any>> {
    try {
      const supabase = createClient();
      
      // Only delete from document_tracker table, not from employees table
      const { data, error } = await supabase
        .from('document_tracker')
        .delete()
        .in('id', ids);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { data };
    } catch (error: any) {
      console.error('Error batch deleting documents:', error);
      return { error: error.message };
    }
  }
};
