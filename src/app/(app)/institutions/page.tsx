"use client";

import Link from "next/link";
import { useInstitutions } from "@/contexts/InstitutionContext";
import PageHeaderTitle from "@/components/common/page-header-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, PlusCircle, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstitutionsPage() {
  const { institutions, selectInstitution, activeInstitution, isLoading } = useInstitutions();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Manage Institutions"
          description="View, select, or create new educational institution profiles."
          icon={Building}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="Manage Institutions"
        description="View, select, or create new educational institution profiles."
        icon={Building}
      />

      <div className="flex justify-end mb-6">
        <Button asChild>
          <Link href="/institutions/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Institution
          </Link>
        </Button>
      </div>

      {institutions.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <List className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">No Institutions Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              You haven't created any institution profiles yet.
              Get started by creating your first one.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/institutions/new">Create New Institution</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {institutions.map((institution) => (
            <Card 
              key={institution.id} 
              className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${activeInstitution?.id === institution.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
            >
              <CardHeader>
                <CardTitle>{institution.name}</CardTitle>
                <CardDescription>{institution.type} - {institution.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-between">
                <p className="text-sm text-muted-foreground truncate mb-4" title={institution.programsOffered}>
                  Programs: {institution.programsOffered.substring(0,50)}{institution.programsOffered.length > 50 ? "..." : ""}
                </p>
                <Button 
                  onClick={() => selectInstitution(institution.id)} 
                  className="w-full"
                  variant={activeInstitution?.id === institution.id ? "default" : "outline"}
                >
                  {activeInstitution?.id === institution.id ? "Selected" : "Select Institution"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
