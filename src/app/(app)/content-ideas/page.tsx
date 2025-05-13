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


import type { GenerateContentIdeasInput, GenerateContentIdeasOutput, ContentIdeaWithStatus } from '@/ai/schemas/content-ideas-schemas'; // Updated import
import { generateContentIdeas } from '@/ai/flows/generate-content-ideas';
import { expandContentIdea } from '@/ai/flows/expand-content-idea';
import type { ExpandContentIdeaInput } from '@/ai/schemas/content-ideas-schemas'; // Updated import


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
  const { activeInstitution } = useInstitutions();
  const [isLoading, setIsLoading] = useState(false); // For generating new list
  const [result, setResult] = useState<GenerateContentIdeasOutput | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});


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
    // When generating a new list, previous results are replaced.
    // setResult(null); // Explicitly clear if you want loading state to show "generating new" vs "loading old"
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
    } finally {
      setIsLoading(false);
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
        idea.id === ideaId ? { ...idea, isExpanding: true, expandedDetails: isRegeneration ? undefined : idea.expandedDetails } : idea // Clear old details if regenerating
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
      // Ensure the collapsible for this item is open after expansion
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


  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="AI Content Idea Generator"
        description="Fuel your content strategy with AI-generated ideas tailored to your institution. Expand ideas for more details."
        icon={Lightbulb}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Institution Profile</CardTitle>
          <CardDescription>Tell us about your institution to get relevant content ideas. Select an institution or fill details manually.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="institutionName" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Future Innovators Academy" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="institutionType" render={({ field }) => (<FormItem><FormLabel>Institution Type</FormLabel><FormControl><Input placeholder="e.g., K-12 School" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="targetAudience" render={({ field }) => (<FormItem><FormLabel>Target Audience</FormLabel><FormControl><Textarea placeholder="Who is this content for?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="programsOffered" render={({ field }) => (<FormItem><FormLabel>Programs Offered</FormLabel><FormControl><Textarea placeholder="Describe key programs..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="uniqueSellingPoints" render={({ field }) => (<FormItem><FormLabel>Unique Selling Points</FormLabel><FormControl><Textarea placeholder="What makes your institution special?" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <Button type="submit" disabled={isLoading || !activeInstitution} className="w-full md:w-auto">
                {isLoading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : result && result.contentIdeas.length > 0 ? "Re-generate Content Ideas" : "Generate Content Ideas"}
              </Button>
               {!activeInstitution && <p className="text-sm text-destructive mt-2">Please select or create an institution to generate ideas.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && ( // Show spinner if actively generating new list
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Brainstorming content ideas for you...</p>
        </div>
      )}

      {!isLoading && result && result.contentIdeas && result.contentIdeas.length > 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Content Ideas</CardTitle>
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
                        <Button variant="ghost" className="flex-1 justify-start text-left px-0 hover:bg-transparent text-base">
                           <ChevronsUpDown className="mr-2 h-5 w-5 flex-shrink-0 text-primary" />
                           <span className="flex-1 font-medium">{idea.text}</span>
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
                           <Button variant="outline" size="sm" onClick={() => handleExpandIdea(idea.id, true)} className="mt-2 text-primary border-primary hover:bg-primary/10" disabled={idea.isExpanding || !activeInstitution}>
                             {idea.isExpanding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                             Re-generate Details
                           </Button>
                        </>
                      )}
                       {!idea.isExpanding && !idea.expandedDetails && (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-2">No details generated yet for this idea.</p>
                          <Button variant="default" size="sm" onClick={() => handleExpandIdea(idea.id, false)} disabled={!activeInstitution}>
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
      )}
       {/* Message if no data could be generated OR if no data has been loaded/generated yet */}
       {!isLoading && result && result.contentIdeas && result.contentIdeas.length === 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>No Content Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No content ideas have been generated for {activeInstitution ? activeInstitution.name : "this institution"} yet, or the AI could not generate ideas based on the current input. Please try refining your input or use the form above to generate ideas.</p>
          </CardContent>
        </Card>
      )}
      {!isLoading && !result && activeInstitution && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Content Ideas Available</CardTitle></CardHeader>
           <CardContent>
             <p>No content ideas have been generated for {activeInstitution.name} yet. Please use the form above to generate them.</p>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
