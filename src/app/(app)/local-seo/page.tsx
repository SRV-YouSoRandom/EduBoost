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
import { useState, useEffect, useCallback } from "react";
import { Loader2, MapPin, SearchCheck, ListChecks, Link2, Settings2, Presentation, Target, FileText, TrendingUp, Clock, Wand2, Trash2 } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { cn, truncateText, deepClone } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { GenerateLocalSEOStrategyInput, GenerateLocalSEOStrategyOutput, KeywordItemWithStatus, AIKeywordResearch, AITrackingReporting } from '@/ai/schemas/local-seo-schemas'; // Added AI types
import { generateLocalSEOStrategy } from '@/ai/flows/generate-local-seo-strategy';
import { refineLocalSEOStrategy, RefineLocalSEOStrategyInput } from '@/ai/flows/refine-local-seo-strategy';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  websiteUrl: z.string().url("Please enter a valid URL."),
});

interface SeoListItemProps {
  item: KeywordItemWithStatus;
  onStatusChange: (itemId: string, newStatus: Status) => void;
  onSetItemToDelete: (item: KeywordItemWithStatus) => void;
}

const SeoListItem: React.FC<SeoListItemProps> = ({ item, onStatusChange, onSetItemToDelete }) => {
  const getStatusSpecificStyling = (status: Status) => {
    switch (status) {
      case 'done': return 'line-through text-muted-foreground opacity-70';
      case 'rejected': return 'text-destructive opacity-70';
      default: return '';
    }
  };

  return (
    <li 
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
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusControl
          currentStatus={item.status}
          onStatusChange={(newStatus) => onStatusChange(item.id, newStatus)}
          size="sm"
        />
        {item.status === 'rejected' && (
           <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onSetItemToDelete(item)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        )}
      </div>
    </li>
  );
};


const SectionDisplay: React.FC<{ title: string; content?: string; icon?: React.ElementType; }> = 
  ({ title, content, icon: Icon }) => {
  if (!content) return null;
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          {Icon && <Icon className="mr-2 h-6 w-6 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownDisplay content={content} asCard={false} className="text-sm"/>
      </CardContent>
    </Card>
  );
};


export default function LocalSeoPage() {
  const { toast } = useToast();
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<GenerateLocalSEOStrategyOutput | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<{ listType: 'primaryKeywords' | 'secondaryKeywords' | 'longTailKeywords' | 'kpis'; item: KeywordItemWithStatus } | null>(null);


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
  
  const fetchStrategy = useCallback(async (institutionId: string) => {
    setIsPageLoading(true);
    setResult(null);
    const { data, error } = await supabase
      .from('local_seo_strategies')
      .select('strategy_data')
      .eq('institution_id', institutionId)
      .single();

    if (error && error.code !== 'PGRST116') { 
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error fetching Local SEO strategy:", error, "Full details:", errorDetails);
      toast({ title: "Error Fetching Strategy", description: `Could not fetch saved strategy. ${error.message || 'Please check console for details.'}`, variant: "destructive" });
    } else if (data && data.strategy_data) {
      setResult(data.strategy_data as GenerateLocalSEOStrategyOutput);
    }
    setIsPageLoading(false);
  }, [toast]);


  useEffect(() => {
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        websiteUrl: activeInstitution.websiteUrl || "",
      });
      fetchStrategy(activeInstitution.id);
    } else {
      form.reset({
        institutionName: "", location: "", programsOffered: "",
        targetAudience: "", websiteUrl: "",
      });
      setResult(null);
      setIsPageLoading(false);
    }
  }, [activeInstitution, form, fetchStrategy]);

  const saveStrategyToSupabase = async (strategyData: GenerateLocalSEOStrategyOutput) => {
    if (!activeInstitution) return;
    const { error } = await supabase.from('local_seo_strategies').upsert({
      institution_id: activeInstitution.id,
      strategy_data: strategyData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'institution_id' });

    if (error) {
      const errorDetails = `Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}, Code: ${error.code}`;
      console.error("Error saving Local SEO strategy:", error, "Full details:", errorDetails);
      toast({
        title: "Error Saving Strategy",
        description: `Could not save strategy. ${error.message || 'Please check console for details.'}`,
        variant: "destructive",
      });
    } else {
      // toast({ title: "Strategy Saved", description: "Your Local SEO strategy has been saved." });
    }
  };


  async function onInitialSubmit(values: z.infer<typeof formSchema>) {
    if (!activeInstitution) return;
    setIsGenerating(true);
    setResult(null); 
    try {
      const data = await generateLocalSEOStrategy(values);
      setResult(data);
      await saveStrategyToSupabase(data);
      toast({
        title: "Strategy Generated!",
        description: "Your local SEO strategy has been successfully created and saved.",
      });
    } catch (error) {
      console.error("Error generating local SEO strategy:", error);
      toast({
        title: "Error Generating Strategy",
        description: (error as Error).message || "Could not generate the local SEO strategy. Please try again.",
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
      const institutionContextForRefinement: GenerateLocalSEOStrategyInput = {
        institutionName: activeInstitution.name,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        websiteUrl: activeInstitution.websiteUrl || "",
      };
      const currentStrategyClone = deepClone(result);
      const refineInput: RefineLocalSEOStrategyInput = {
        currentStrategy: currentStrategyClone,
        userPrompt: refinementPrompt,
        institutionContext: institutionContextForRefinement,
      };
      const updatedStrategy = await refineLocalSEOStrategy(refineInput);
      setResult(updatedStrategy);
      await saveStrategyToSupabase(updatedStrategy);
      setRefinementPrompt(""); 
      toast({ title: "Strategy Refined!", description: "The local SEO strategy has been updated and saved." });
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
  
  const handleItemStatusChange = async (
    listType: 'primaryKeywords' | 'secondaryKeywords' | 'longTailKeywords' | 'kpis',
    itemId: string,
    newStatus: Status
  ) => {
    if (!result || !activeInstitution) return;

    let updatedResult = deepClone(result); 
  
    const mapItems = (items: KeywordItemWithStatus[]) => 
      items.map(item => item.id === itemId ? { ...item, status: newStatus } : item);
    
    if (listType === 'primaryKeywords') updatedResult.keywordResearch.primaryKeywords = mapItems(updatedResult.keywordResearch.primaryKeywords);
    else if (listType === 'secondaryKeywords') updatedResult.keywordResearch.secondaryKeywords = mapItems(updatedResult.keywordResearch.secondaryKeywords);
    else if (listType === 'longTailKeywords') updatedResult.keywordResearch.longTailKeywords = mapItems(updatedResult.keywordResearch.longTailKeywords);
    else if (listType === 'kpis') updatedResult.trackingReporting.kpis = mapItems(updatedResult.trackingReporting.kpis);
    
    setResult(updatedResult);
    await saveStrategyToSupabase(updatedResult);
  };
  
  const handleDeleteSeoItem = async () => {
    if (!itemToDelete || !result || !activeInstitution) return;
    let updatedResult = deepClone(result);

    const filterItems = (items: KeywordItemWithStatus[]) => items.filter(item => item.id !== itemToDelete.item.id);

    switch (itemToDelete.listType) {
      case 'primaryKeywords':
        updatedResult.keywordResearch.primaryKeywords = filterItems(updatedResult.keywordResearch.primaryKeywords);
        break;
      case 'secondaryKeywords':
        updatedResult.keywordResearch.secondaryKeywords = filterItems(updatedResult.keywordResearch.secondaryKeywords);
        break;
      case 'longTailKeywords':
        updatedResult.keywordResearch.longTailKeywords = filterItems(updatedResult.keywordResearch.longTailKeywords);
        break;
      case 'kpis':
        updatedResult.trackingReporting.kpis = filterItems(updatedResult.trackingReporting.kpis);
        break;
    }

    setResult(updatedResult);
    await saveStrategyToSupabase(updatedResult);

    toast({ title: "Item Deleted", description: "The SEO item has been removed." });
    setItemToDelete(null);
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

      {result && activeInstitution && (
        <div className="space-y-6">
          <SectionDisplay title="Executive Summary" content={result.executiveSummary} icon={FileText} />
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><SearchCheck className="mr-2 h-6 w-6 text-primary" />Keyword Research</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.keywordResearch.primaryKeywords && result.keywordResearch.primaryKeywords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-md mb-2">Primary Keywords</h4>
                  <ul className="space-y-3">
                    {result.keywordResearch.primaryKeywords.map(item => <SeoListItem key={item.id} item={item} onStatusChange={(id, status) => handleItemStatusChange('primaryKeywords', id, status)} onSetItemToDelete={(item) => setItemToDelete({ listType: 'primaryKeywords', item})}/>)}
                  </ul>
                </div>
              )}
              {result.keywordResearch.secondaryKeywords && result.keywordResearch.secondaryKeywords.length > 0 && (
                 <div>
                  <h4 className="font-semibold text-md mt-4 mb-2">Secondary Keywords</h4>
                  <ul className="space-y-3">
                    {result.keywordResearch.secondaryKeywords.map(item => <SeoListItem key={item.id} item={item} onStatusChange={(id, status) => handleItemStatusChange('secondaryKeywords', id, status)} onSetItemToDelete={(item) => setItemToDelete({ listType: 'secondaryKeywords', item})} />)}
                  </ul>
                </div>
              )}
              {result.keywordResearch.longTailKeywords && result.keywordResearch.longTailKeywords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-md mt-4 mb-2">Long-Tail Keywords</h4>
                  <ul className="space-y-3">
                    {result.keywordResearch.longTailKeywords.map(item => <SeoListItem key={item.id} item={item} onStatusChange={(id, status) => handleItemStatusChange('longTailKeywords', id, status)} onSetItemToDelete={(item) => setItemToDelete({ listType: 'longTailKeywords', item})} />)}
                  </ul>
                </div>
              )}
              {result.keywordResearch.toolsMention && <div className="text-sm mt-4"><strong className="block mb-1">Tools Mentioned:</strong> <MarkdownDisplay content={result.keywordResearch.toolsMention} asCard={false} /></div>}
              
              {getKeywordChartData(result.keywordResearch).length > 0 && (
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getKeywordChartData(result.keywordResearch)}>
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

          <SectionDisplay title="Google My Business Optimization" content={result.gmbOptimization && Object.values(result.gmbOptimization).some(val => val) ? JSON.stringify(result.gmbOptimization) : "No GMB optimization details."} icon={MapPin} />
          <SectionDisplay title="On-Page Local SEO" content={result.onPageLocalSEO && Object.values(result.onPageLocalSEO).some(val => val) ? JSON.stringify(result.onPageLocalSEO) : "No On-Page SEO details."} icon={ListChecks} />
          <SectionDisplay title="Local Link Building" content={result.localLinkBuilding && Object.values(result.localLinkBuilding).some(val => val) ? JSON.stringify(result.localLinkBuilding) : "No Link Building details."} icon={Link2} />
          <SectionDisplay title="Technical Local SEO" content={result.technicalLocalSEO && Object.values(result.technicalLocalSEO).some(val => val) ? JSON.stringify(result.technicalLocalSEO) : "No Technical SEO details."} icon={Settings2} />

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-xl"><Presentation className="mr-2 h-6 w-6 text-primary" />Tracking & Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.trackingReporting.googleAnalytics && <div className="text-sm"><strong className="block mb-1">Google Analytics:</strong> <MarkdownDisplay content={result.trackingReporting.googleAnalytics} asCard={false} /></div>}
              {result.trackingReporting.googleSearchConsole && <div className="text-sm"><strong className="block mb-1">Google Search Console:</strong> <MarkdownDisplay content={result.trackingReporting.googleSearchConsole} asCard={false} /></div>}
              {result.trackingReporting.kpis && result.trackingReporting.kpis.length > 0 && (
                <div>
                  <h4 className="font-semibold text-md mt-4 mb-2">Key Performance Indicators (KPIs)</h4>
                  <ul className="space-y-3">
                    {result.trackingReporting.kpis.map(item => <SeoListItem key={item.id} item={item} onStatusChange={(id, status) => handleItemStatusChange('kpis', id, status)} onSetItemToDelete={(item) => setItemToDelete({ listType: 'kpis', item})}/>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
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

      {!result && activeInstitution && !isGenerating && !isPageLoading && (
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

      {!activeInstitution && !isGenerating && !isPageLoading &&(
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Institution Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please select or create an institution to generate or view a Local SEO strategy.</p>
          </CardContent>
        </Card>
      )}
      
      {isGenerating && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Generating your local SEO strategy, please wait...</p>
        </div>
      )}

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item: "{truncateText(itemToDelete.item.text, 10)}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSeoItem}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
