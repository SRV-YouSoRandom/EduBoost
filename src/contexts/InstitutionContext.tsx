"use client";

import type { Institution } from "@/types/institution";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface InstitutionContextType {
  institutions: Institution[];
  activeInstitution: Institution | null;
  addInstitution: (institution: Omit<Institution, 'id'>) => void;
  // updateInstitution: (institution: Institution) => void; // Future use
  // deleteInstitution: (id: string) => void; // Future use
  selectInstitution: (id: string | null) => void;
  isLoading: boolean;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_INSTITUTIONS = 'eduboost_institutions';
const LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID = 'eduboost_active_institution_id';

export const InstitutionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load from localStorage

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
          }
        } else if (parsedInstitutions.length > 0) {
          // Default to the first institution if no active one is set
          setActiveInstitution(parsedInstitutions[0]);
          localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_INSTITUTION_ID, parsedInstitutions[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load institutions from localStorage:", error);
      // Clear potentially corrupted localStorage
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
    const newInstitution: Institution = { ...institutionData, id: Date.now().toString() }; // Simple ID generation
    setInstitutions(prev => [...prev, newInstitution]);
    if (!activeInstitution) {
      setActiveInstitution(newInstitution);
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
    <InstitutionContext.Provider value={{ institutions, activeInstitution, addInstitution, selectInstitution, isLoading }}>
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
