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
import MarkdownDisplay from "@/components/common/markdown-display";
import StatusControl from "@/components/common/StatusControl";
import type { Status } from "@/types/common";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, BarChartBig } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";

import type { GeneratePerformanceMarketingStrategyInput, GeneratePerformanceMarketingStrategyOutput } from '@/ai/flows/generate-performance-marketing-strategy';
import { generatePerformanceMarketingStrategy } from '@/ai/flows/generate-performance-marketing-strategy';

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programsOffered: z.string().min(10, "Programs offered description is too short."), 
  location: z.string().min(2, "Location is required."),
  marketingBudget: z.string().min(1, "Marketing budget is required (e.g., $5000, Flexible)."),
  marketingGoals: z.string().min(10, "Marketing goals description is too short."),
});

const PAGE_STORAGE_PREFIX = "perfMarketingResult";


export default function PerformanceMarketingPage() {
  const { toast } = useToast();
  const { activeInstitution } = useInstitutions();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratePerformanceMarketingStrategyOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      institutionType: "",
      targetAudience: "",
      programsOffered: "", 
      location: "",
      marketingBudget: "",
      marketingGoals: "",
    },
  });
  
  const getCurrentStorageKey = (): string | null => {
    if (activeInstitution?.id) {
      return `${PAGE_STORAGE_PREFIX}_${activeInstitution.id}`;
    }
    return null;
  };

  useEffect(() => {
    if (activeInstitution) {
      // Preserve user-entered budget and goals if they exist, otherwise use institution defaults or empty
      const currentBudget = form.getValues("marketingBudget");
      const currentGoals = form.getValues("marketingGoals");

      form.reset({
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered, 
        location: activeInstitution.location,
        marketingBudget: currentBudget || "", // Or a specific field from activeInstitution if it exists
        marketingGoals: currentGoals || "",   // Or a specific field from activeInstitution if it exists
      });

      const key = getCurrentStorageKey();
      if (key) {
        const storedResult = localStorage.getItem(key);
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error(`Failed to parse stored perf marketing results for ${key}:`, error);
            localStorage.removeItem(key); 
            setResult(null);
          }
        } else {
          setResult(null); 
        }
      }
    } else {
       form.reset({ 
        institutionName: "", institutionType: "", targetAudience: "",
        programsOffered: "", location: "", marketingBudget: "", marketingGoals: "",
      });
      setResult(null); 
    }
  }, [activeInstitution, form]); 

  useEffect(() => {
    const key = getCurrentStorageKey();
    if (key && result) {
      localStorage.setItem(key, JSON.stringify(result));
    } else if (key && !result) {
      localStorage.removeItem(key);
    }
  }, [result, activeInstitution?.id]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // For performance marketing, generating new strategy should replace old one.
    // setResult(null); // Clears previous results if full re-generation is intended.
    try {
      const data = await generatePerformanceMarketingStrategy(values);
      setResult(data); 
      toast({
        title: "Strategy Generated!",
        description: "Your performance marketing strategy has been successfully created.",
      });
    } catch (error) {
      console.error("Error generating performance marketing strategy:", error);
      toast({
        title: "Error Generating Strategy",
        description: (error as Error).message || "Could not generate strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDocumentStatusChange = (newStatus: Status) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      return { ...prevResult, documentStatus: newStatus };
    });
  };

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="Performance Marketing Strategy Generator"
        description="Outline your institution's details to generate a comprehensive performance marketing strategy document."
        icon={BarChartBig}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Institution &amp; Marketing Goals</CardTitle>
          <CardDescription>Complete the form to get your AI-generated strategy. Select an institution or fill details manually.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Metropolis University" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input placeholder="e.g., University, College" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="Describe your primary target audience..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea placeholder="List key programs for marketing..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location (City, State)</FormLabel><FormControl><Input placeholder="e.g., Metropolis, CA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="marketingBudget" render={({ field }) => (<FormItem><FormLabel>Marketing Budget</FormLabel><FormControl><Input placeholder="e.g., $10,000/month" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="marketingGoals" render={({ field }) => (<FormItem><FormLabel>Marketing Goals</FormLabel><FormControl><Textarea placeholder="What are the main objectives?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isLoading || !activeInstitution} className="w-full md:w-auto">
                 {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : result ? "Re-generate Strategy Document" : "Generate Performance Marketing Strategy"}
              </Button>
              {!activeInstitution && <p className="text-sm text-destructive mt-2">Please select or create an institution to generate a strategy.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Crafting your performance marketing strategy...</p>
        </div>
      )}

      {!isLoading && result && result.marketingStrategyDocument && (
        <Card className="mt-6 shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Generated Performance Marketing Strategy</CardTitle>
            <StatusControl
              currentStatus={result.documentStatus || 'pending'}
              onStatusChange={handleDocumentStatusChange}
            />
          </CardHeader>
          <CardContent>
            <MarkdownDisplay content={result.marketingStrategyDocument} asCard={false} />
          </CardContent>
        </Card>
      )}
      {!isLoading && !result && activeInstitution && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Performance Marketing Strategy Available</CardTitle></CardHeader>
           <CardContent>
             <p>No strategy document has been generated for {activeInstitution.name} yet. Please use the form above to generate one.</p>
           </CardContent>
         </Card>
       )}
        {/* Fallback for when a previously generated strategy was empty or AI failed */}
      {!isLoading && result && !result.marketingStrategyDocument && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>Strategy Generation Issue</CardTitle></CardHeader>
           <CardContent>
             <p>The AI could not generate a performance marketing strategy, or the stored strategy is empty. Please try refining your input in the form above and re-generating.</p>
           </CardContent>
         </Card>
       )}
    </div>
  );
}