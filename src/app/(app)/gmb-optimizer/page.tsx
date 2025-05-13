"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Loader2, Building } from "lucide-react";

import type { GenerateGMBOptimizationsInput, GenerateGMBOptimizationsOutput } from '@/ai/flows/generate-gmb-optimizations';
import { generateGMBOptimizations } from '@/ai/flows/generate-gmb-optimizations';

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

async function generateOptimizationsAction(input: GenerateGMBOptimizationsInput): Promise<{ success: boolean; data?: GenerateGMBOptimizationsOutput; error?: string }> {
  "use server";
  try {
    const result = await generateGMBOptimizations(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating GMB optimizations:", error);
    return { success: false, error: (error as Error).message || "Failed to generate GMB optimizations." };
  }
}

export default function GmbOptimizerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateGMBOptimizationsOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      institutionType: "",
      location: "",
      programsOffered: "",
      targetAudience: "",
      uniqueSellingPoints: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await generateOptimizationsAction(values);
      if (response.success && response.data) {
        setResult(response.data);
        toast({
          title: "Optimizations Generated!",
          description: "Your GMB optimization suggestions have been successfully created.",
        });
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error) {
      toast({
        title: "Error Generating Optimizations",
        description: (error as Error).message || "Could not generate GMB optimizations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="AI-Powered GMB Optimizer"
        description="Optimize your Google My Business profile with AI-driven suggestions."
        icon={Building}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>GMB Profile Details</CardTitle>
          <CardDescription>Provide information about your institution to receive GMB optimization tips.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="institutionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lincoln High School" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="institutionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., High School, University, Vocational School" {...field} />
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
                      <Input placeholder="e.g., Lincoln, NE" {...field} />
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
                        placeholder="Briefly describe key programs or specializations..."
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
                        placeholder="Who are you trying to reach? (e.g., prospective students, parents of K-12 students)..."
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
                        placeholder="What makes your institution stand out? (e.g., award-winning faculty, specialized programs, strong alumni network)..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Optimizations...
                  </>
                ) : (
                  "Generate GMB Optimizations"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Generating your GMB optimizations, please wait...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader><CardTitle>Keyword Suggestions</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{result.keywordSuggestions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Description Suggestions</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{result.descriptionSuggestions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Additional Optimization Tips</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap">{result.optimizationTips}</p></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
