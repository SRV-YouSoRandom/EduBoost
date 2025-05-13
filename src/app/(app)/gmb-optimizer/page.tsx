
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
import { Loader2, Building, TrendingUp, Clock, SearchCheck, Wand2 } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import MarkdownDisplay from "@/components/common/markdown-display";
import { cn } from "@/lib/utils";

import type { GenerateGMBOptimizationsInput, GenerateGMBOptimizationsOutput, GMBKeywordSuggestion } from '@/ai/schemas/gmb-optimizer-schemas';
import { generateGMBOptimizations } from '@/ai/flows/generate-gmb-optimizations';
import { refineGMBOptimizations, RefineGMBOptimizationsInput } from '@/ai/flows/refine-gmb-optimizations';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

type GMBSectionKey = 'descriptionSuggestions' | 'optimizationTips' | 'keywordSuggestionsSection';

const PAGE_STORAGE_PREFIX = "gmbOptimizerResult";

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
            <span className="block">{item.text}</span>
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
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<GenerateGMBOptimizationsOutput | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);

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

  const getCurrentStorageKey = (): string | null => {
    if (activeInstitution?.id) {
      return `${PAGE_STORAGE_PREFIX}_${activeInstitution.id}`;
    }
    return null;
  };

  useEffect(() => {
    setIsPageLoading(true);
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      });
      const key = getCurrentStorageKey();
      if (key) {
        const storedResult = localStorage.getItem(key);
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error(`Failed to parse stored GMB results for ${key}:`, error);
            localStorage.removeItem(key); 
            setResult(null);
          }
        } else {
          setResult(null); 
        }
      }
    } else {
      form.reset({
        institutionName: "", institutionType: "", location: "",
        programsOffered: "", targetAudience: "", uniqueSellingPoints: "",
      });
      setResult(null); 
    }
    setIsPageLoading(false);
  }, [activeInstitution]);
  
  useEffect(() => {
    if(!isPageLoading) {
      const key = getCurrentStorageKey();
      if (key && result) {
        localStorage.setItem(key, JSON.stringify(result));
      } else if (key && !result) {
        localStorage.removeItem(key);
      }
    }
  }, [result, activeInstitution?.id, isPageLoading]);


  async function onInitialSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setResult(null);
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
      setResult(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefineOptimizations() {
    if (!result || !refinementPrompt.trim() || !activeInstitution) {
      toast({ title: "Cannot refine", description: "An existing strategy, a refinement prompt, and an active institution are required.", variant: "destructive" });
      return;
    }
    setIsRefining(true);
    try {
      const institutionContextForRefinement: GenerateGMBOptimizationsInput = {
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      };
      const refineInput: RefineGMBOptimizationsInput = {
        currentStrategy: result,
        userPrompt: refinementPrompt,
        institutionContext: institutionContextForRefinement,
      };
      const updatedStrategy = await refineGMBOptimizations(refineInput);
      setResult(updatedStrategy);
      setRefinementPrompt(""); 
      toast({ title: "Optimizations Refined!", description: "The GMB optimizations have been updated." });
    } catch (error) {
      console.error("Error refining GMB optimizations:", error);
      toast({
        title: "Error Refining Optimizations",
        description: (error as Error).message || "Could not refine optimizations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  }


  const handleSectionStatusChange = (sectionKey: GMBSectionKey, newStatus: Status) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      const statusFieldKey = sectionKey === 'keywordSuggestionsSection' 
        ? 'keywordSuggestionsSectionStatus' 
        : `${sectionKey}Status` as keyof GenerateGMBOptimizationsOutput;

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

  if (isInstitutionLoading || isPageLoading) {
     return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Loading GMB Optimizer..."
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
        title="AI-Powered GMB Optimizer"
        description="Optimize your Google My Business profile with AI-driven suggestions."
        icon={Building}
      />

      {result && activeInstitution && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
               <CardTitle className="flex items-center"><SearchCheck className="mr-2 h-6 w-6 text-primary" />Keyword Suggestions</CardTitle>
              <StatusControl
                currentStatus={result.keywordSuggestionsSectionStatus || 'pending'} 
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
                currentStatus={result.descriptionSuggestionsStatus || 'pending'}
                onStatusChange={(newStatus) => handleSectionStatusChange('descriptionSuggestions', newStatus)}
              />
            </CardHeader>
            <CardContent><MarkdownDisplay content={result.descriptionSuggestions} asCard={false} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Additional Optimization Tips</CardTitle>
              <StatusControl
                currentStatus={result.optimizationTipsStatus || 'pending'}
                onStatusChange={(newStatus) => handleSectionStatusChange('optimizationTips', newStatus)}
              />
            </CardHeader>
            <CardContent><MarkdownDisplay content={result.optimizationTips} asCard={false} /></CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5" />Refine GMB Optimizations</CardTitle>
              <CardDescription>Provide a prompt to modify the current GMB suggestions (e.g., "Suggest more keywords for online programs", "Make the description shorter").</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your refinement prompt here..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleRefineOptimizations} disabled={isRefining || !refinementPrompt.trim() || isGenerating}>
                {isRefining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</> : "Refine Optimizations"}
              </Button>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
             <CardHeader>
               <CardTitle>Start Over: Generate New Optimizations</CardTitle>
               <CardDescription>Fill details to generate new GMB optimizations. This will replace the current displayed suggestions.</CardDescription>
             </CardHeader>
             <CardContent>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   </div>
                   <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="uniqueSellingPoints" render={({ field }) => (<FormItem><FormLabel>Unique Selling Points</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <Button type="submit" disabled={isGenerating || !activeInstitution || isRefining}>
                     {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate New GMB Optimizations"}
                   </Button>
                 </form>
               </Form>
             </CardContent>
           </Card>
        </div>
      )}
      
      {!result && activeInstitution && !isGenerating && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No GMB Optimizations Available for {activeInstitution.name}</CardTitle>
            <CardDescription>Provide information about your institution to receive GMB optimization tips. Select an institution or fill details manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Lincoln High School" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input placeholder="e.g., High School, University" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location (City, State)</FormLabel><FormControl><Input placeholder="e.g., Lincoln, NE" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea placeholder="Briefly describe key programs..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="Who are you trying to reach?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="uniqueSellingPoints" render={({ field }) => (<FormItem><FormLabel>Unique Selling Points</FormLabel><FormControl><Textarea placeholder="What makes your institution stand out?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={isGenerating || !activeInstitution} className="w-full md:w-auto">
                  {isGenerating ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : "Generate GMB Optimizations"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!activeInstitution && !isGenerating && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Institution Selected</CardTitle></CardHeader>
           <CardContent>
             <p>Please select or create an institution to generate or view GMB optimizations.</p>
           </CardContent>
         </Card>
      )}

      {isGenerating && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Generating your GMB optimizations, please wait...</p>
        </div>
      )}
    </div>
  );
}
