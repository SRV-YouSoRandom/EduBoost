"use client";

import type { Institution } from "@/types/institution";
import { supabase } from "@/lib/supabaseClient";
import { fromSupabaseInstitution, toSupabaseInstitutionInsert, toSupabaseInstitutionUpdate, Database } from "@/types/supabase";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast"; // For user feedback

interface InstitutionContextType {
  institutions: Institution[];
  activeInstitution: Institution | null;
  addInstitution: (institution: Omit<Institution, 'id'>) => Promise<Institution | null>;
  updateInstitution: (id: string, data: Partial<Omit<Institution, 'id'>>) => Promise<Institution | null>;
  deleteInstitution: (id: string) => Promise<void>;
  selectInstitution: (id: string | null) => void;
  isLoading: boolean;
  fetchInstitutions: () => Promise<void>; // Expose fetch function
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID = 'eduboost_active_institution_id'; 

export const InstitutionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('institutions').select('*').order('created_at', { ascending: false });

    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error fetching institutions:", error, "Full details:", errorDetails);
      toast({ title: "Error Fetching Institutions", description: `Could not fetch institutions. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
      setInstitutions([]);
    } else if (data) {
      const fetchedInstitutions = data.map(fromSupabaseInstitution);
      setInstitutions(fetchedInstitutions);

      const storedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
      if (storedActiveId) {
        const foundActive = fetchedInstitutions.find(inst => inst.id === storedActiveId);
        setActiveInstitution(foundActive || (fetchedInstitutions.length > 0 ? fetchedInstitutions[0] : null));
      } else if (fetchedInstitutions.length > 0) {
        setActiveInstitution(fetchedInstitutions[0]);
      } else {
        setActiveInstitution(null);
      }
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  useEffect(() => {
    if (activeInstitution) {
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID, activeInstitution.id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
    }
  }, [activeInstitution]);

  const addInstitution = async (institutionData: Omit<Institution, 'id'>): Promise<Institution | null> => {
    setIsLoading(true);
    const supabaseData = toSupabaseInstitutionInsert(institutionData, null); 
    
    const { data, error } = await supabase
      .from('institutions')
      .insert(supabaseData)
      .select()
      .single();

    setIsLoading(false);
    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error adding institution:", error, "Full details:", errorDetails);
      toast({ title: "Error Adding Institution", description: `Could not add institution. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
      return null;
    }
    if (data) {
      const newInstitution = fromSupabaseInstitution(data);
      setInstitutions(prev => [newInstitution, ...prev]);
      if (!activeInstitution || institutions.length === 0) {
        setActiveInstitution(newInstitution);
      }
      return newInstitution;
    }
    return null;
  };

  const updateInstitution = async (id: string, updateData: Partial<Omit<Institution, 'id'>>): Promise<Institution | null> => {
    setIsLoading(true);
    const supabaseUpdateData = toSupabaseInstitutionUpdate(updateData);
    const { data, error } = await supabase
      .from('institutions')
      .update(supabaseUpdateData)
      .eq('id', id)
      .select()
      .single();
    
    setIsLoading(false);
    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error updating institution:", error, "Full details:", errorDetails);
      toast({ title: "Error Updating Institution", description: `Could not update institution. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
      return null;
    }
    if (data) {
      const updatedInstitution = fromSupabaseInstitution(data);
      setInstitutions(prev => 
        prev.map(inst => inst.id === id ? updatedInstitution : inst)
      );
      if (activeInstitution?.id === id) {
        setActiveInstitution(updatedInstitution);
      }
      return updatedInstitution;
    }
    return null;
  };

  const deleteInstitution = async (id: string): Promise<void> => {
    setIsLoading(true);
    const { error } = await supabase.from('institutions').delete().eq('id', id);
    setIsLoading(false);
    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error deleting institution:", error, "Full details:", errorDetails);
      toast({ title: "Error Deleting Institution", description: `Could not delete institution. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
      return;
    }
    
    const remainingInstitutions = institutions.filter(inst => inst.id !== id);
    setInstitutions(remainingInstitutions);
    if (activeInstitution?.id === id) {
      setActiveInstitution(remainingInstitutions.length > 0 ? remainingInstitutions[0] : null);
    }
    toast({ title: "Success", description: "Institution deleted." });
  };

  const selectInstitution = (id: string | null) => {
    if (id === null) {
      setActiveInstitution(null);
      return;
    }
    const institutionToSelect = institutions.find(inst => inst.id === id);
    setActiveInstitution(institutionToSelect || null);
  };

  return (
    <InstitutionContext.Provider value={{ 
      institutions, 
      activeInstitution, 
      addInstitution, 
      updateInstitution, 
      deleteInstitution, 
      selectInstitution, 
      isLoading,
      fetchInstitutions
    }}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitutions = (): InstitutionContextType => {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitutions must be used within an InstitutionProvider');
  }
  return context;
};
