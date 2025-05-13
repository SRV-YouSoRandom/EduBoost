
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
import MarkdownDisplay from "@/components/common/markdown-display";
import type { Status } from "@/types/common";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Lightbulb, Sparkles, ChevronsUpDown, Wand2 } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


import type { GenerateContentIdeasInput, GenerateContentIdeasOutput, ContentIdeaWithStatus } from '@/ai/schemas/content-ideas-schemas';
import { generateContentIdeas } from '@/ai/flows/generate-content-ideas';
import { expandContentIdea, ExpandContentIdeaInput } from '@/ai/flows/expand-content-idea';
import { refineContentIdeas, RefineContentIdeasInput } from '@/ai/flows/refine-content-ideas';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

const PAGE_STORAGE_PREFIX = "contentIdeasResult";

export default function ContentIdeasPage() {
  const { toast } = useToast();
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<GenerateContentIdeasOutput | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      institutionType: "",
      targetAudience: "",
      programsOffered: "",
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
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      });
      const key = getCurrentStorageKey();
      if (key) {
        const storedResult = localStorage.getItem(key);
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error(`Failed to parse stored content ideas for ${key}:`, error);
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
        programsOffered: "", uniqueSellingPoints: "",
      });
      setResult(null); 
    }
    setOpenCollapsibles({}); 
    setIsPageLoading(false);
  }, [activeInstitution, form]); // Added form to dependency array


  useEffect(() => {
    if (!isPageLoading) {
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
      const data = await generateContentIdeas(values);
      setResult(data); 
      toast({
        title: "Content Ideas Generated!",
        description: "A fresh batch of content ideas has been successfully created for you.",
      });
    } catch (error) {
      console.error("Error generating content ideas:", error);
      toast({
        title: "Error Generating Ideas",
        description: (error as Error).message || "Could not generate content ideas. Please try again.",
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefineIdeas() {
    if (!result || !refinementPrompt.trim() || !activeInstitution) {
      toast({ title: "Cannot refine", description: "Existing ideas, a refinement prompt, and an active institution are required.", variant: "destructive" });
      return;
    }
    setIsRefining(true);
    try {
      const institutionContext: GenerateContentIdeasInput = {
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      };
      const refineInput: RefineContentIdeasInput = {
        currentIdeas: result,
        userPrompt: refinementPrompt,
        institutionContext: institutionContext,
      };
      const updatedIdeas = await refineContentIdeas(refineInput);
      setResult(updatedIdeas);
      setRefinementPrompt("");
      toast({ title: "Ideas Refined!", description: "The content ideas list has been updated." });
    } catch (error) {
      console.error("Error refining content ideas:", error);
      toast({
        title: "Error Refining Ideas",
        description: (error as Error).message || "Could not refine content ideas.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  }

  const handleStatusChange = (id: string, newStatus: Status) => {
    setResult(prevResult => {
      if (!prevResult) return null;
      const updatedIdeas = prevResult.contentIdeas.map(idea =>
        idea.id === id ? { ...idea, status: newStatus } : idea
      );
      return { ...prevResult, contentIdeas: updatedIdeas };
    });
  };

  const handleExpandIdea = async (ideaId: string, isRegeneration: boolean = false) => {
    const ideaToExpand = result?.contentIdeas.find(idea => idea.id === ideaId);
    if (!ideaToExpand || !activeInstitution) {
       toast({
        title: "Cannot Expand Idea",
        description: "Please select an institution and ensure the idea exists.",
        variant: "destructive",
      });
      return;
    }

    setResult(prev => prev ? ({
      ...prev,
      contentIdeas: prev.contentIdeas.map(idea => 
        idea.id === ideaId ? { ...idea, isExpanding: true, expandedDetails: isRegeneration ? undefined : idea.expandedDetails } : idea
      ),
    }) : null);

    try {
      const institutionContext: GenerateContentIdeasInput = {
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      };
      const expansionInput: ExpandContentIdeaInput = {
        ideaText: ideaToExpand.text,
        institutionContext: institutionContext,
      };
      const expansionResult = await expandContentIdea(expansionInput);
      
      setResult(prev => prev ? ({
        ...prev,
        contentIdeas: prev.contentIdeas.map(idea =>
          idea.id === ideaId 
            ? { ...idea, expandedDetails: expansionResult.expandedDetails, isExpanding: false } 
            : idea
        ),
      }) : null);
      toast({
        title: isRegeneration ? "Details Re-generated!" : "Idea Expanded!",
        description: "Details have been successfully generated for the content idea. Check the expanded section.",
      });
      setOpenCollapsibles(prev => ({ ...prev, [ideaId]: true }));
    } catch (error) {
      console.error("Error expanding content idea:", error);
      toast({
        title: "Error Expanding Idea",
        description: (error as Error).message || "Could not expand the content idea.",
        variant: "destructive",
      });
      setResult(prev => prev ? ({
        ...prev,
        contentIdeas: prev.contentIdeas.map(idea =>
          idea.id === ideaId ? { ...idea, isExpanding: false } : idea
        ),
      }) : null);
    }
  };
  
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

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isInstitutionLoading || isPageLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Loading Content Ideas..."
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
        title="AI Content Idea Generator"
        description="Fuel your content strategy with AI-generated ideas tailored to your institution. Expand ideas for more details."
        icon={Lightbulb}
      />

      {result && result.contentIdeas && result.contentIdeas.length > 0 && activeInstitution && (
        <>
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle>Generated Content Ideas for {activeInstitution.name}</CardTitle>
              <CardDescription>Manage status and expand ideas for details like scripts or outlines. Click an idea to see more.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.contentIdeas.map((idea: ContentIdeaWithStatus) => (
                  <li 
                    key={idea.id} 
                    className={cn(
                      "p-4 rounded-lg border bg-card",
                      getStatusSpecificStyling(idea.status)
                    )}
                  >
                    <Collapsible open={openCollapsibles[idea.id] || false} onOpenChange={() => toggleCollapsible(idea.id)}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="flex-1 justify-start text-left px-0 text-base">
                             <ChevronsUpDown className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                             <span className="flex-1 font-medium min-w-0 break-words">{idea.text}</span>
                          </Button>
                        </CollapsibleTrigger>
                         <div className="flex items-center gap-2 flex-shrink-0 md:ml-4">
                          <StatusControl
                            currentStatus={idea.status}
                            onStatusChange={(newStatus) => handleStatusChange(idea.id, newStatus)}
                            size="sm"
                          />
                        </div>
                      </div>
                      <CollapsibleContent className="mt-4 pt-4 border-t space-y-3">
                        {idea.isExpanding && (
                          <div className="flex items-center text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating details...
                          </div>
                        )}
                        {!idea.isExpanding && idea.expandedDetails && (
                          <>
                            <MarkdownDisplay content={idea.expandedDetails} asCard={false} />
                             <Button variant="outline" size="sm" onClick={() => handleExpandIdea(idea.id, true)} className="mt-2 text-primary border-primary hover:bg-primary/10" disabled={idea.isExpanding || !activeInstitution || isRefining}>
                               {idea.isExpanding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                               Re-generate Details
                             </Button>
                          </>
                        )}
                         {!idea.isExpanding && !idea.expandedDetails && (
                          <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground mb-2">No details generated yet for this idea.</p>
                            <Button variant="default" size="sm" onClick={() => handleExpandIdea(idea.id, false)} disabled={!activeInstitution || isRefining}>
                              <Sparkles className="mr-2 h-4 w-4" /> Get Details / Script
                            </Button>
                          </div>
                         )}
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Wand2 className="mr-2 h-5 w-5" />Refine Content Ideas</CardTitle>
              <CardDescription>Provide a prompt to modify the current list of ideas (e.g., "Add more ideas for video content", "Focus on STEM programs").</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your refinement prompt here..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleRefineIdeas} disabled={isRefining || !refinementPrompt.trim() || isGenerating}>
                {isRefining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refining...</> : "Refine Ideas"}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
             <CardHeader>
               <CardTitle>Start Over: Generate New Ideas</CardTitle>
               <CardDescription>This will replace the current list of ideas for {activeInstitution.name}.</CardDescription>
             </CardHeader>
             <CardContent>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                   {/* Form fields are pre-filled from activeInstitution, display them as read-only or enable for override */}
                   <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input {...field} readOnly={!!activeInstitution} /></FormControl><FormMessage /></FormItem>)} />
                   {/* Add other relevant fields if needed for re-generation context, or ensure they are used from activeInstitution */}
                   <Button type="submit" disabled={isGenerating || !activeInstitution || isRefining} className="w-full md:w-auto">
                     {isGenerating ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                     ) : "Generate New Content Ideas"}
                   </Button>
                 </form>
               </Form>
             </CardContent>
           </Card>
        </>
      )}

      {(!result || result.contentIdeas.length === 0) && activeInstitution && !isGenerating && (
         <Card className="shadow-lg">
           <CardHeader>
             <CardTitle>No Content Ideas for {activeInstitution.name}</CardTitle>
             <CardDescription>Tell us about your institution to get relevant content ideas.</CardDescription>
           </CardHeader>
           <CardContent>
             <Form {...form}>
               <form onSubmit={form.handleSubmit(onInitialSubmit)} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Future Innovators Academy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input placeholder="e.g., K-12 School" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </div>
                 <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="Who is this content for?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea placeholder="Describe key programs..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="uniqueSellingPoints" render={({ field }) => (<FormItem><FormLabel>Unique Selling Points</FormLabel><FormControl><Textarea placeholder="What makes your institution special?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <Button type="submit" disabled={isGenerating || !activeInstitution} className="w-full md:w-auto">
                   {isGenerating ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                   ) : "Generate Content Ideas"}
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
             <p>Please select or create an institution to generate or view content ideas.</p>
           </CardContent>
         </Card>
       )}

      {isGenerating && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Brainstorming content ideas for you...</p>
        </div>
      )}
    </div>
  );
}

