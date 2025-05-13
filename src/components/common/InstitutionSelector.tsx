"use client";

import React from 'react';
import { useInstitutions } from '@/contexts/InstitutionContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { School, PlusCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function InstitutionSelector() {
  const { institutions, activeInstitution, selectInstitution, isLoading } = useInstitutions();

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }
  
  if (institutions.length === 0) {
    return (
      <Button variant="outline" asChild size="sm">
        <Link href="/institutions/new">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Institution
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <School className="h-5 w-5 text-muted-foreground" />
      <Select
        value={activeInstitution?.id || ""}
        onValueChange={(value) => selectInstitution(value)}
      >
        <SelectTrigger className="w-[180px] sm:w-[250px] md:w-[300px] text-sm">
          <SelectValue placeholder="Select Institution..." />
        </SelectTrigger>
        <SelectContent>
          {institutions.map((inst) => (
            <SelectItem key={inst.id} value={inst.id}>
              {inst.name}
            </SelectItem>
          ))}
           <SelectItem value="CREATE_NEW_INSTITUTION_PLACEHOLDER" disabled className="opacity-0 pointer-events-none h-0 p-0 m-0">
            Hidden item for new link styling
          </SelectItem>
           <div className="p-2 border-t mt-1">
             <Button variant="ghost" className="w-full justify-start" asChild size="sm">
                <Link href="/institutions/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New
                </Link>
             </Button>
           </div>
        </SelectContent>
      </Select>
    </div>
  );
}
