"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeaderTitle from "@/components/common/page-header-title";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit3, Save } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import type { Institution } from "@/types/institution";
import LocationAutocompleteInput from "@/components/common/LocationAutocompleteInput"; // Assuming this is used

const formSchema = z.object({
  name: z.string().min(2, "Institution name must be at least 2 characters."),
  type: z.string().min(2, "Institution type is required (e.g., University, K-12 School)."),
  location: z.string().min(2, "Location is required (e.g., City, State)."),
  programsOffered: z.string().min(10, "Programs offered description must be at least 10 characters."),
  targetAudience: z.string().min(10, "Target audience description must be at least 10 characters."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points must be at least 10 characters."),
  websiteUrl: z.string().url("Please enter a valid URL (e.g., https://example.com).").optional().or(z.literal("")),
});

export default function EditInstitutionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { institutions, updateInstitution, isLoading: institutionsLoading } = useInstitutions();
  const [isSaving, setIsSaving] = useState(false);
  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);

  const institutionId = typeof params.id === 'string' ? params.id : null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      programsOffered: "",
      targetAudience: "",
      uniqueSellingPoints: "",
      websiteUrl: "",
    },
  });

  useEffect(() => {
    if (!institutionsLoading && institutionId) {
      const foundInstitution = institutions.find(inst => inst.id === institutionId);
      if (foundInstitution) {
        setCurrentInstitution(foundInstitution);
        form.reset({
          name: foundInstitution.name,
          type: foundInstitution.type,
          location: foundInstitution.location,
          programsOffered: foundInstitution.programsOffered,
          targetAudience: foundInstitution.targetAudience,
          uniqueSellingPoints: foundInstitution.uniqueSellingPoints,
          websiteUrl: foundInstitution.websiteUrl || "",
        });
      } else {
        toast({
          title: "Institution Not Found",
          description: "The institution you are trying to edit does not exist.",
          variant: "destructive",
        });
        router.push("/institutions");
      }
    }
  }, [institutionId, institutions, institutionsLoading, form, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!institutionId) return;
    setIsSaving(true);
    try {
      const institutionData: Partial<Omit<Institution, 'id'>> = {
        ...values,
        websiteUrl: values.websiteUrl || undefined,
      };
      updateInstitution(institutionId, institutionData);
      
      toast({
        title: "Institution Updated!",
        description: `${values.name} has been successfully updated.`,
      });
      router.push("/institutions");
    } catch (error) {
      console.error("Error updating institution:", error);
      toast({
        title: "Error Updating Institution",
        description: (error as Error).message || "Could not update the institution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (institutionsLoading || !currentInstitution) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle title="Loading Institution..." icon={Loader2} />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Loading Details...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title={`Edit ${currentInstitution?.name || "Institution"}`}
        description="Update the details of the educational institution profile."
        icon={Edit3}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>Modify the form to update the institution profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Future Innovators Academy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., K-12 School, Online Coding Bootcamp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (City, State)</FormLabel>
                    <FormControl>
                       <LocationAutocompleteInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="e.g., San Francisco, CA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="programsOffered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programs Offered</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe key programs, courses, or areas of study..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Who is this institution for? (e.g., prospective students, parents, alumni)..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uniqueSellingPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Selling Points</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What makes this institution special? (e.g., project-based learning, career services)..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSaving || institutionsLoading} className="w-full md:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
