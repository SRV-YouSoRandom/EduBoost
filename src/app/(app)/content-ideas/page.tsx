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
import { Loader2, Lightbulb } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";

import type { GenerateContentIdeasInput, GenerateContentIdeasOutput, ContentIdeaWithStatus } from '@/ai/flows/generate-content-ideas';
import { generateContentIdeas } from '@/ai/flows/generate-content-ideas';
import { cn } from "@/lib/utils";

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

const LOCAL_STORAGE_KEY_CONTENT_IDEAS = "contentIdeasResult";

export default function ContentIdeasPage() {
  const { toast } = useToast();
  const { activeInstitution } = useInstitutions();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateContentIdeasOutput | null>(null);

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

  useEffect(() => {
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        institutionType: activeInstitution.type,
        targetAudience: activeInstitution.targetAudience,
        programsOffered: activeInstitution.programsOffered,
        uniqueSellingPoints: activeInstitution.uniqueSellingPoints,
      });
      // Clear previous results when institution changes
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS);
    } else {
       form.reset({ // Reset to default if no active institution
        institutionName: "",
        institutionType: "",
        targetAudience: "",
        programsOffered: "",
        uniqueSellingPoints: "",
      });
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS);
    }
  }, [activeInstitution, form]);

  useEffect(() => {
    const storedResult = localStorage.getItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS);
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (error) {
        console.error("Failed to parse stored content ideas:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS);
      }
    }
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS, JSON.stringify(result));
    }
  }, [result]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CONTENT_IDEAS); 
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
  
  const statusIconMap: Record<Status, React.ElementType> = {
    pending: Lightbulb, // Placeholder, actual icon from StatusControl
    inProgress: Loader2,
    done: Lightbulb, // Placeholder
    rejected: Lightbulb, // Placeholder
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


  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="AI Content Idea Generator"
        description="Fuel your content strategy with AI-generated ideas tailored to your institution."
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
                <FormField
                  control={form.control}
                  name="institutionName"
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
                  name="institutionType"
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
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Who is this content for? (e.g., prospective students, parents, alumni, industry partners)..."
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
                name="uniqueSellingPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Selling Points</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What makes your institution special? (e.g., focus on project-based learning, strong career services, unique campus culture)..."
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
                    Generating Ideas...
                  </>
                ) : (
                  "Generate Content Ideas"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && !result && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Brainstorming content ideas for you...</p>
        </div>
      )}

      {result && result.contentIdeas && result.contentIdeas.length > 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Content Ideas</CardTitle>
            <CardDescription>Manage the status of your generated content ideas below.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {result.contentIdeas.map((idea: ContentIdeaWithStatus) => (
                <li 
                  key={idea.id} 
                  className={cn(
                    "flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-lg border bg-card gap-4",
                    getStatusSpecificStyling(idea.status)
                  )}
                >
                  <span className="flex-1">{idea.text}</span>
                  <StatusControl
                    currentStatus={idea.status}
                    onStatusChange={(newStatus) => handleStatusChange(idea.id, newStatus)}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
       {result && result.contentIdeas && result.contentIdeas.length === 0 && !isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>No Content Ideas Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The AI could not generate content ideas based on the provided input. Please try refining your input or try again later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
