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
import { useState, useEffect, useCallback } from "react";
import { Loader2, BarChartBig, Wand2 } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import { supabase } from "@/lib/supabaseClient";

import type { GeneratePerformanceMarketingStrategyInput, GeneratePerformanceMarketingStrategyOutput } from '@/ai/schemas/performance-marketing-schemas';
import { generatePerformanceMarketingStrategy } from '@/ai/flows/generate-performance-marketing-strategy';
import { refinePerformanceMarketingStrategy, RefinePerformanceMarketingStrategyInput } from '@/ai/flows/refine-performance-marketing-strategy';

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programsOffered: z.string().min(10, "Programs offered description is too short."), 
  location: z.string().min(2, "Location is required."),
  marketingBudget: z.string().min(1, "Marketing budget is required (e.g., $5000, Flexible)."),
  marketingGoals: z.string().min(10, "Marketing goals description is too short."),
});


export default function PerformanceMarketingPage() {
  const { toast } = useToast();
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<GeneratePerformanceMarketingStrategyOutput | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);

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
  
  const fetchStrategy = useCallback(async (institutionId: string) => {
    setIsPageLoading(true);
    setResult(null);
    const { data, error } = await supabase
      .from('performance_marketing_strategies')
      .select('strategy_data')
      .eq('institution_id', institutionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error fetching performance marketing strategy:", error, "Full details:", errorDetails);
      toast({ title: "Error Fetching Strategy", description: `Could not fetch saved strategy. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
    } else if (data && data.strategy_data) {
      setResult(data.strategy_data as GeneratePerformanceMarketingStrategyOutput);
    }
    setIsPageLoading(false);
  }, [toast]);

  useEffect(() => {
    if (activeInstitution) {
      const currentBudget = form.getValues("marketingBudget");
      const currentGoals = form.getValues("marketingGoals");

      form.reset({
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered, 
        location: activeInstitution.location,
        marketingBudget: currentBudget || "", 
        marketingGoals: currentGoals || "",   
      });
      fetchStrategy(activeInstitution.id);
    } else {
       form.reset({ 
        institutionName: "", institutionType: "", targetAudience: "",
        programsOffered: "", location: "", marketingBudget: "", marketingGoals: "",
      });
      setResult(null); 
      setIsPageLoading(false);
    }
  }, [activeInstitution, form, fetchStrategy]); 

  const saveStrategyToSupabase = async (strategyData: GeneratePerformanceMarketingStrategyOutput) => {
    if (!activeInstitution) return;
    const { error } = await supabase.from('performance_marketing_strategies').upsert({
      institution_id: activeInstitution.id,
      strategy_data: strategyData,
    }, { onConflict: 'institution_id' });

    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error saving performance marketing strategy:", error, "Full details:", errorDetails);
      toast({ title: "Error Saving Strategy", description: `Could not save strategy. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
    } else {
      toast({ title: "Strategy Saved", description: "Your performance marketing strategy has been saved." });
    }
  };


  async function onInitialSubmit(values: z.infer<typeof formSchema>) {
    if(!activeInstitution) return;
    setIsGenerating(true);
    setResult(null); 
    try {
      const data = await generatePerformanceMarketingStrategy(values);
      setResult(data); 
      await saveStrategyToSupabase(data);
      toast({
        title: "Strategy Generated!",
        description: "Your performance marketing strategy has been successfully created and saved.",
      });
    } catch (error) {
      console.error("Error generating performance marketing strategy:", error);
      toast({
        title: "Error Generating Strategy",
        description: (error as Error).message || "Could not generate strategy. Please try again.",
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefineStrategy() {
    if (!result || !refinementPrompt.trim() || !activeInstitution) {
      toast({ title: "Cannot refine", description: "An existing strategy, a refinement prompt, and an active institution are required.", variant: "destructive" });
      return;
    }
    setIsRefining(true);
    try {
      const institutionContextForRefinement: GeneratePerformanceMarketingStrategyInput = {
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered,
        location: activeInstitution.location,
        marketingBudget: form.getValues("marketingBudget"),
        marketingGoals: form.getValues("marketingGoals"),
      };
      const refineInput: RefinePerformanceMarketingStrategyInput = {
        currentStrategy: result,
        userPrompt: refinementPrompt,
        institutionContext: institutionContextForRefinement,
      };
      const updatedStrategy = await refinePerformanceMarketingStrategy(refineInput);
      setResult(updatedStrategy);
      await saveStrategyToSupabase(updatedStrategy);
      setRefinementPrompt("");
      toast({ title: "Strategy Refined!", description: "The performance marketing strategy has been updated and saved." });
    } catch (error) {
      console.error("Error refining performance marketing strategy:", error);
      toast({
        title: "Error Refining Strategy",
        description: (error as Error).message || "Could not refine strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  }

  const handleDocumentStatusChange = async (newStatus: Status) => {
    if (!result || !activeInstitution) return;
    const updatedResult = { ...result, documentStatus: newStatus };
    setResult(updatedResult);
    await saveStrategyToSupabase(updatedResult);
  };

  if (isInstitutionLoading || isPageLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Loading Performance Marketing..."
          description="Please wait while we load your data."
          icon={Loader2}
        />
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="Performance Marketing Strategy Generator"
        description="Outline your institution's details to generate a comprehensive performance marketing strategy document."
        icon={BarChartBig}
      />

      {result && activeInstitution && (
        <div className="space-y-6">
          <Card className="shadow-lg">
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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5" />Refine Marketing Strategy</CardTitle>
              <CardDescription>Provide a prompt to modify the current strategy document (e.g., "Elaborate more on YouTube advertising options", "Suggest KPIs for brand awareness").</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your refinement prompt here..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleRefineStrategy} disabled={isRefining || !refinementPrompt.trim() || isGenerating}>
                {isRefining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</> : "Refine Strategy Document"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Start Over: Generate New Strategy Document</CardTitle>
              <CardDescription>Fill details to generate a new strategy. This will replace the current displayed document.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="marketingBudget" render={({ field }) => (<FormItem><FormLabel>Marketing Budget</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="marketingGoals" render={({ field }) => (<FormItem><FormLabel>Marketing Goals</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={isGenerating || !activeInstitution || isRefining}>
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate New Strategy Document"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && activeInstitution && !isGenerating && !isPageLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Performance Marketing Strategy for {activeInstitution.name}</CardTitle>
            <CardDescription>Complete the form to get your AI-generated strategy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
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
                <Button type="submit" disabled={isGenerating || !activeInstitution} className="w-full md:w-auto">
                   {isGenerating ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : "Generate Performance Marketing Strategy"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

       {!activeInstitution && !isGenerating && !isPageLoading && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Institution Selected</CardTitle></CardHeader>
           <CardContent>
             <p>Please select or create an institution to generate or view a Performance Marketing strategy.</p>
           </CardContent>
         </Card>
       )}

      {isGenerating && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Crafting your performance marketing strategy...</p>
        </div>
      )}
    </div>
  );
}
