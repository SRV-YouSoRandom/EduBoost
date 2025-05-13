
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
import type { Status, ItemWithIdAndStatus } from "@/types/common"; 
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, MapPin, SearchCheck, ListChecks, Link2, Settings2, Presentation, Target, FileText, TrendingUp, Clock, Wand2 } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { cn } from "@/lib/utils";

import type { GenerateLocalSEOStrategyInput, GenerateLocalSEOStrategyOutput, KeywordItemWithStatus } from '@/ai/flows/generate-local-seo-strategy';
import { generateLocalSEOStrategy } from '@/ai/flows/generate-local-seo-strategy';
import { refineLocalSEOStrategy, RefineLocalSEOStrategyInput } from '@/ai/flows/refine-local-seo-strategy';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  websiteUrl: z.string().url("Please enter a valid URL."),
});

const PAGE_STORAGE_PREFIX = "localSeoResult";


const ListWithStatusDisplay: React.FC<{ title: string; items: (KeywordItemWithStatus | ItemWithIdAndStatus)[]; onStatusChange: (itemId: string, newStatus: Status) => void; listType?: 'keywordResearch' | 'kpis' }> = ({ title, items, onStatusChange }) => {
  if (!items || items.length === 0) return <p className="text-muted-foreground">No {title.toLowerCase()} available.</p>;
  
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
    <div className="space-y-3">
      <h4 className="font-semibold text-md">{title}</h4>
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
              {('searchVolumeLast24h' in item && item.searchVolumeLast24h) && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-3 w-3" /> 24h: {item.searchVolumeLast24h}
                </p>
              )}
              {('searchVolumeLast7d' in item && item.searchVolumeLast7d) && (
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
    </div>
  );
};


const SectionDisplay: React.FC<{ title: string; content?: string | Record<string, any>; icon?: React.ElementType; chartData?: any[]; chartType?: 'bar'; onItemsStatusChange?: (listType: 'keywordResearch' | 'kpis', itemId: string, newStatus: Status) => void; }> = 
  ({ title, content, icon: Icon, chartData, chartType, onItemsStatusChange }) => {
  if (!content && !chartData) return null;

  const renderContent = (data: string | Record<string, any>): React.ReactNode => {
    if (typeof data === 'string') {
      return <MarkdownDisplay content={data} asCard={false} className="text-sm"/>;
    }
    if (typeof data === 'object' && data !== null) {
      if (title === "Keyword Research" && 'primaryKeywords' in data && onItemsStatusChange) {
        const keywordData = data as GenerateLocalSEOStrategyOutput['keywordResearch'];
        return (
          <div className="space-y-4">
            <ListWithStatusDisplay title="Primary Keywords" items={keywordData.primaryKeywords || []} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} />
            <ListWithStatusDisplay title="Secondary Keywords" items={keywordData.secondaryKeywords || []} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} />
            <ListWithStatusDisplay title="Long-Tail Keywords" items={keywordData.longTailKeywords || []} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} />
            {keywordData.toolsMention && <div className="text-sm"><strong>Tools Mentioned:</strong> <MarkdownDisplay content={keywordData.toolsMention} asCard={false} />}</div>}
          </div>
        );
      }
      if (title === "Tracking & Reporting" && 'kpis' in data && Array.isArray((data as any).kpis) && onItemsStatusChange) {
        const trackingData = data as GenerateLocalSEOStrategyOutput['trackingReporting'];
        return (
          <div className="space-y-4">
            {trackingData.googleAnalytics && <div className="text-sm"><strong>Google Analytics:</strong> <MarkdownDisplay content={trackingData.googleAnalytics} asCard={false} /></div>}
            {trackingData.googleSearchConsole && <div className="text-sm"><strong>Google Search Console:</strong> <MarkdownDisplay content={trackingData.googleSearchConsole} asCard={false} /></div>}
            <ListWithStatusDisplay 
              title="Key Performance Indicators (KPIs)" 
              items={trackingData.kpis || []} 
              onStatusChange={(id, status) => onItemsStatusChange('kpis', id, status)}
            />
          </div>
        );
      }
      // Fallback for other objects
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (typeof value === 'string') {
              return (
                <div key={key} className="text-sm">
                  <strong className="capitalize block mb-1">{formattedKey}: </strong> 
                  <MarkdownDisplay content={value} asCard={false}/>
                </div>
              );
            }
             return ( // For nested objects, recursively call or handle differently. This is a simple display.
              <div key={key} className="text-sm">
                <strong className="capitalize block mb-1">{formattedKey}: </strong> 
                 {typeof value === 'object' ? <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">{JSON.stringify(value, null, 2)}</pre> : String(value)}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {Icon && <Icon className="mr-2 h-6 w-6 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content && renderContent(content)}
        {chartType === 'bar' && chartData && chartData.length > 0 && (
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend wrapperStyle={{color: "hsl(var(--foreground))"}} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function LocalSeoPage() {
  const { toast } = useToast();
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [isGenerating, setIsGenerating] = useState(false); // For initial generation
  const [isRefining, setIsRefining] = useState(false); // For refinement
  const [result, setResult] = useState<GenerateLocalSEOStrategyOutput | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true); // For loading data from localStorage

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      location: "",
      programsOffered: "",
      targetAudience: "",
      websiteUrl: "",
    },
  });

  const getCurrentStorageKey = (): string | null => {
    if (activeInstitution?.id) {
      return `${PAGE_STORAGE_PREFIX}_${activeInstitution.id}`;
    }
    return null;
  };

  // Effect for loading/resetting form and loading stored result
  useEffect(() => {
    setIsPageLoading(true);
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        websiteUrl: activeInstitution.websiteUrl || "",
      });
      const key = getCurrentStorageKey();
      if (key) {
        const storedResult = localStorage.getItem(key);
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error(`Failed to parse stored local SEO results for ${key}:`, error);
            localStorage.removeItem(key);
            setResult(null);
          }
        } else {
          setResult(null);
        }
      }
    } else {
      form.reset({
        institutionName: "", location: "", programsOffered: "",
        targetAudience: "", websiteUrl: "",
      });
      setResult(null);
    }
    setIsPageLoading(false);
  }, [activeInstitution]);

  // Effect for saving result to localStorage
  useEffect(() => {
    if (!isPageLoading) { // Only save after initial load
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
      const data = await generateLocalSEOStrategy(values);
      setResult(data);
      toast({
        title: "Strategy Generated!",
        description: "Your local SEO strategy has been successfully created.",
      });
    } catch (error) {
      console.error("Error generating local SEO strategy:", error);
      toast({
        title: "Error Generating Strategy",
        description: (error as Error).message || "Could not generate the local SEO strategy. Please try again.",
        variant: "destructive",
      });
      setResult(null); // Ensure result is null on error
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
      const institutionContextForRefinement: GenerateLocalSEOStrategyInput = {
        institutionName: activeInstitution.name,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        websiteUrl: activeInstitution.websiteUrl || "",
      };
      const refineInput: RefineLocalSEOStrategyInput = {
        currentStrategy: result,
        userPrompt: refinementPrompt,
        institutionContext: institutionContextForRefinement,
      };
      const updatedStrategy = await refineLocalSEOStrategy(refineInput);
      setResult(updatedStrategy);
      setRefinementPrompt(""); 
      toast({ title: "Strategy Refined!", description: "The local SEO strategy has been updated based on your prompt." });
    } catch (error) {
      console.error("Error refining local SEO strategy:", error);
      toast({
        title: "Error Refining Strategy",
        description: (error as Error).message || "Could not refine the strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  }
  
  const handleItemStatusChange = (
    listType: 'keywordResearch' | 'kpis',
    itemId: string,
    newStatus: Status
  ) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      let updatedResult = { ...prevResult };
  
      const mapItems = (items: (KeywordItemWithStatus | ItemWithIdAndStatus)[]) => 
        items.map(item => item.id === itemId ? { ...item, status: newStatus } : item);
      
      if (listType === 'keywordResearch' && updatedResult.keywordResearch) {
        updatedResult.keywordResearch = {
          ...updatedResult.keywordResearch,
          primaryKeywords: mapItems(updatedResult.keywordResearch.primaryKeywords || []) as KeywordItemWithStatus[],
          secondaryKeywords: mapItems(updatedResult.keywordResearch.secondaryKeywords || []) as KeywordItemWithStatus[],
          longTailKeywords: mapItems(updatedResult.keywordResearch.longTailKeywords || []) as KeywordItemWithStatus[],
        };
      } else if (listType === 'kpis' && updatedResult.trackingReporting) {
        updatedResult.trackingReporting = {
          ...updatedResult.trackingReporting,
          kpis: mapItems(updatedResult.trackingReporting.kpis || []) as KeywordItemWithStatus[], 
        };
      }
      return updatedResult;
    });
  };
  
  const getKeywordChartData = (keywordResearch: GenerateLocalSEOStrategyOutput['keywordResearch'] | undefined) => {
    if (!keywordResearch) return [];
    return [
      { name: 'Primary Keywords', count: keywordResearch.primaryKeywords?.length || 0 },
      { name: 'Secondary Keywords', count: keywordResearch.secondaryKeywords?.length || 0 },
      { name: 'Long-Tail Keywords', count: keywordResearch.longTailKeywords?.length || 0 },
    ];
  };

  if (isInstitutionLoading || isPageLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Loading Local SEO Strategy..."
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
        title="AI-Powered Local SEO Strategy"
        description="Generate, view, and refine tailored local SEO strategies for your institution."
        icon={MapPin}
      />

      {/* Display Existing Strategy and Refinement Options */}
      {result && activeInstitution && (
        <div className="space-y-6">
          <SectionDisplay title="Executive Summary" content={result.executiveSummary} icon={FileText} />
          <SectionDisplay 
            title="Keyword Research" 
            content={result.keywordResearch} 
            icon={SearchCheck}
            chartData={getKeywordChartData(result.keywordResearch)}
            chartType="bar"
            onItemsStatusChange={handleItemStatusChange}
          />
          <SectionDisplay title="Google My Business Optimization" content={result.gmbOptimization} icon={MapPin} />
          <SectionDisplay title="On-Page Local SEO" content={result.onPageLocalSEO} icon={ListChecks} />
          <SectionDisplay title="Local Link Building" content={result.localLinkBuilding} icon={Link2} />
          <SectionDisplay title="Technical Local SEO" content={result.technicalLocalSEO} icon={Settings2} />
          <SectionDisplay title="Tracking & Reporting" content={result.trackingReporting} icon={Presentation} onItemsStatusChange={handleItemStatusChange} />
          <SectionDisplay title="Conclusion" content={result.conclusion} icon={Target} />

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5" />Refine Current Strategy with AI</CardTitle>
              <CardDescription>Provide a prompt to modify or add to the current strategy (e.g., "Add 'best design schools in [location]' to primary keywords and analyze its potential.").</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your refinement prompt here..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleRefineStrategy} disabled={isRefining || !refinementPrompt.trim() || isGenerating}>
                {isRefining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</> : "Refine with AI"}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
             <CardHeader>
               <CardTitle>Start Over: Generate New Full Strategy</CardTitle>
               <CardDescription>Fill details to generate a new strategy. This will replace the current displayed strategy.</CardDescription>
             </CardHeader>
             <CardContent>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   </div>
                   <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="websiteUrl" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <Button type="submit" disabled={isGenerating || !activeInstitution || isRefining}>
                     {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating New Strategy...</> : "Generate New Full Strategy"}
                   </Button>
                 </form>
               </Form>
             </CardContent>
           </Card>
        </div>
      )}

      {/* Initial Generation Form or No Data Message */}
      {!result && activeInstitution && !isGenerating && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Local SEO Strategy Available for {activeInstitution.name}</CardTitle>
            <CardDescription>Please fill out the form below to generate a new strategy, or select another institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Springfield University" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location (City, State)</FormLabel><FormControl><Input placeholder="e.g., Springfield, IL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea placeholder="Describe the main programs and courses offered..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="Describe your primary target audience..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="websiteUrl" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" placeholder="https://www.example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={isGenerating || !activeInstitution}>
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Strategy...</> : "Generate Local SEO Strategy"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!activeInstitution && !isGenerating && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Institution Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select or create an institution to generate or view a Local SEO strategy.</p>
          </CardContent>
        </Card>
      )}
      
      {isGenerating && ( // Specific loading indicator for generation process
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Generating your local SEO strategy, please wait...</p>
        </div>
      )}
    </div>
  );
}
    
