"use client";

import type { Institution } from "@/types/institution";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface InstitutionContextType {
  institutions: Institution[];
  activeInstitution: Institution | null;
  addInstitution: (institution: Omit<Institution, 'id'>) => void;
  updateInstitution: (id: string, data: Partial<Omit<Institution, 'id'>>) => void;
  deleteInstitution: (id: string) => void;
  selectInstitution: (id: string | null) => void;
  isLoading: boolean;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_INSTITUTIONS = 'eduboost_institutions';
const LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID = 'eduboost_active_institution_id';

export const InstitutionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedInstitutions = localStorage.getItem(LOCAL_STORAGE_KEY_INSTITUTIONS);
      if (storedInstitutions) {
        const parsedInstitutions: Institution[] = JSON.parse(storedInstitutions);
        setInstitutions(parsedInstitutions);
        
        const storedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
        if (storedActiveId) {
          const foundActive = parsedInstitutions.find(inst => inst.id === storedActiveId);
          if (foundActive) {
            setActiveInstitution(foundActive);
          } else if (parsedInstitutions.length > 0) { // Active ID exists but not in list, set to first
            setActiveInstitution(parsedInstitutions[0]);
            localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID, parsedInstitutions[0].id);
          } else { // No institutions left
            setActiveInstitution(null);
            localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
          }
        } else if (parsedInstitutions.length > 0) {
          setActiveInstitution(parsedInstitutions[0]);
          localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID, parsedInstitutions[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load institutions from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY_INSTITUTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY_INSTITUTIONS, JSON.stringify(institutions));
    }
  }, [institutions, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (activeInstitution) {
        localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID, activeInstitution.id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID);
      }
    }
  }, [activeInstitution, isLoading]);


  const addInstitution = (institutionData: Omit<Institution, 'id'>) => {
    const newInstitution: Institution = { ...institutionData, id: Date.now().toString() };
    setInstitutions(prev => [...prev, newInstitution]);
    if (!activeInstitution || institutions.length === 0) {
      setActiveInstitution(newInstitution);
    }
  };

  const updateInstitution = (id: string, data: Partial<Omit<Institution, 'id'>>) => {
    setInstitutions(prev => 
      prev.map(inst => inst.id === id ? { ...inst, ...data } : inst)
    );
    if (activeInstitution?.id === id) {
      setActiveInstitution(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deleteInstitution = (id: string) => {
    setInstitutions(prev => prev.filter(inst => inst.id !== id));
    if (activeInstitution?.id === id) {
      const remainingInstitutions = institutions.filter(inst => inst.id !== id);
      if (remainingInstitutions.length > 0) {
        setActiveInstitution(remainingInstitutions[0]);
      } else {
        setActiveInstitution(null);
      }
    }
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
      isLoading 
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
