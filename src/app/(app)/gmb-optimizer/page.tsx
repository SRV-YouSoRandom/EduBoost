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
import StatusControl from "@/components/common/StatusControl";
import type { Status } from "@/types/common";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Building, TrendingUp, Clock, SearchCheck } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import MarkdownDisplay from "@/components/common/markdown-display";
import { cn } from "@/lib/utils";

import type { GenerateGMBOptimizationsInput, GenerateGMBOptimizationsOutput, GMBKeywordSuggestion } from '@/ai/flows/generate-gmb-optimizations';
import { generateGMBOptimizations } from '@/ai/flows/generate-gmb-optimizations';

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

type GMBSectionKey = 'descriptionSuggestions' | 'optimizationTips' | 'keywordSuggestionsSection';

const LOCAL_STORAGE_KEY_GMB_OPTIMIZER = "gmbOptimizerResult";

const KeywordListDisplay: React.FC<{ items: GMBKeywordSuggestion[]; onStatusChange: (itemId: string, newStatus: Status) => void; }> = ({ items, onStatusChange }) => {
  if (!items || items.length === 0) return <p className="text-muted-foreground">No keyword suggestions available.</p>;

  const getStatusSpecificStyling = (status: Status) => {
    switch (status) {
      case 'done':
        return 'line-through text-muted-foreground opacity-70';
      case 'rejected':
        return 'text-destructive opacity-70';
      default:
        return '';
    }
  };
  
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li 
          key={item.id}
          className={cn(
            "flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 rounded-md border bg-card gap-3",
            getStatusSpecificStyling(item.status)
          )}
        >
          <div className="flex-1 space-y-1">
            <span>{item.text}</span>
            {item.searchVolumeLast24h && (
              <p className="text-xs text-muted-foreground flex items-center">
                <Clock className="mr-1 h-3 w-3" /> 24h: {item.searchVolumeLast24h}
              </p>
            )}
            {item.searchVolumeLast7d && (
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" /> 7d: {item.searchVolumeLast7d}
              </p>
            )}
          </div>
          <StatusControl
            currentStatus={item.status}
            onStatusChange={(newStatus) => onStatusChange(item.id, newStatus)}
            size="sm"
          />
        </li>
      ))}
    </ul>
  );
};


export default function GmbOptimizerPage() {
  const { toast } = useToast();
  const { activeInstitution } = useInstitutions();
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

  useEffect(() => {
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      });
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER);
    } else {
      form.reset({
        institutionName: "",
        institutionType: "",
        location: "",
        programsOffered: "",
        targetAudience: "",
        uniqueSellingPoints: "",
      });
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER);
    }
  }, [activeInstitution, form]);
  
  useEffect(() => {
    const storedResult = localStorage.getItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER);
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (error) {
        console.error("Failed to parse stored GMB results:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER);
      }
    }
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER, JSON.stringify(result));
    }
  }, [result]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_GMB_OPTIMIZER);
    try {
      const data = await generateGMBOptimizations(values);
      setResult(data);
      toast({
        title: "Optimizations Generated!",
        description: "Your GMB optimization suggestions have been successfully created.",
      });
    } catch (error) {
      console.error("Error generating GMB optimizations:", error);
      toast({
        title: "Error Generating Optimizations",
        description: (error as Error).message || "Could not generate GMB optimizations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSectionStatusChange = (sectionKey: GMBSectionKey, newStatus: Status) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      // For GMBSectionKey that ends with 'SectionStatus', map to the correct field in GenerateGMBOptimizationsOutput
      const statusFieldKey = `${sectionKey}Status` as keyof GenerateGMBOptimizationsOutput;
      return {
        ...prevResult,
        [statusFieldKey]: newStatus,
      };
    });
  };

  const handleKeywordItemStatusChange = (keywordId: string, newStatus: Status) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      const updatedKeywords = prevResult.keywordSuggestions.map(kw => 
        kw.id === keywordId ? { ...kw, status: newStatus } : kw
      );
      return { ...prevResult, keywordSuggestions: updatedKeywords };
    });
  };


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
          <CardDescription>Provide information about your institution to receive GMB optimization tips. Select an institution or fill details manually.</CardDescription>
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

      {isLoading && !result && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Generating your GMB optimizations, please wait...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
               <CardTitle className="flex items-center"><SearchCheck className="mr-2 h-6 w-6 text-primary" />Keyword Suggestions</CardTitle>
              <StatusControl
                currentStatus={result.keywordSuggestionsSectionStatus} // Status for the whole section
                onStatusChange={(newStatus) => handleSectionStatusChange('keywordSuggestionsSection', newStatus)}
              />
            </CardHeader>
            <CardContent>
              <KeywordListDisplay items={result.keywordSuggestions} onStatusChange={handleKeywordItemStatusChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Description Suggestions</CardTitle>
               <StatusControl
                currentStatus={result.descriptionSuggestionsStatus}
                onStatusChange={(newStatus) => handleSectionStatusChange('descriptionSuggestions', newStatus)}
              />
            </CardHeader>
            <CardContent><MarkdownDisplay content={result.descriptionSuggestions} asCard={false} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Additional Optimization Tips</CardTitle>
              <StatusControl
                currentStatus={result.optimizationTipsStatus}
                onStatusChange={(newStatus) => handleSectionStatusChange('optimizationTips', newStatus)}
              />
            </CardHeader>
            <CardContent><MarkdownDisplay content={result.optimizationTips} asCard={false} /></CardContent>
          </Card>
        </div>
      )}
       {result && (!result.keywordSuggestions || result.keywordSuggestions.length === 0) && !result.descriptionSuggestions && !result.optimizationTips && !isLoading && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Optimizations Generated</CardTitle></CardHeader>
           <CardContent>
             <p>The AI could not generate GMB optimizations based on the provided input. Please try refining your input or try again later.</p>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
