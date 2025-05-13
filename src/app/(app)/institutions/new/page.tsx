"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation"; // For redirecting after save

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
import { useState } from "react";
import { Loader2, Building, Save } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import type { Institution } from "@/types/institution";
import LocationAutocompleteInput from "@/components/common/LocationAutocompleteInput";

const formSchema = z.object({
  name: z.string().min(2, "Institution name must be at least 2 characters."),
  type: z.string().min(2, "Institution type is required (e.g., University, K-12 School)."),
  location: z.string().min(2, "Location is required (e.g., City, State)."),
  programsOffered: z.string().min(10, "Programs offered description must be at least 10 characters."),
  targetAudience: z.string().min(10, "Target audience description must be at least 10 characters."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points must be at least 10 characters."),
  websiteUrl: z.string().url("Please enter a valid URL (e.g., https://example.com).").optional().or(z.literal("")),
});

export default function NewInstitutionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { addInstitution } = useInstitutions();
  const [isSaving, setIsSaving] = useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    try {
      // In a real app, this would be an API call / server action
      // For now, we use the client-side context
      const institutionData: Omit<Institution, 'id'> = {
        ...values,
        websiteUrl: values.websiteUrl || undefined, // Ensure empty string becomes undefined
      };
      addInstitution(institutionData);
      
      toast({
        title: "Institution Created!",
        description: `${values.name} has been successfully added.`,
      });
      router.push("/institutions"); // Redirect to the list of institutions
    } catch (error) {
      console.error("Error creating institution:", error);
      toast({
        title: "Error Creating Institution",
        description: (error as Error).message || "Could not create the institution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="Create New Institution"
        description="Add a new educational institution profile to use with EduBoost tools."
        icon={Building}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>Fill out the form to create a new institution profile.</CardDescription>
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
                        placeholder="Who is this institution for? (e.g., prospective students, parents, alumni, industry partners)..."
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
                        placeholder="What makes this institution special? (e.g., focus on project-based learning, strong career services)..."
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
              <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Institution...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Institution
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
