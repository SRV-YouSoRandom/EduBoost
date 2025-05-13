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
import { Loader2, Lightbulb, CheckCircle } from "lucide-react";

import type { GenerateContentIdeasInput, GenerateContentIdeasOutput } from '@/ai/flows/generate-content-ideas';
import { generateContentIdeas } from '@/ai/flows/generate-content-ideas';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required (e.g., University, High School)."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  uniqueSellingPoints: z.string().min(10, "Unique selling points description is too short."),
});

async function generateIdeasAction(input: GenerateContentIdeasInput): Promise<{ success: boolean; data?: GenerateContentIdeasOutput; error?: string }> {
  "use server";
  try {
    const result = await generateContentIdeas(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating content ideas:", error);
    return { success: false, error: (error as Error).message || "Failed to generate content ideas." };
  }
}

export default function ContentIdeasPage() {
  const { toast } = useToast();
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await generateIdeasAction(values);
      if (response.success && response.data) {
        setResult(response.data);
        toast({
          title: "Content Ideas Generated!",
          description: "A fresh batch of content ideas has been successfully created for you.",
        });
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error) {
      toast({
        title: "Error Generating Ideas",
        description: (error as Error).message || "Could not generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

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
          <CardDescription>Tell us about your institution to get relevant content ideas.</CardDescription>
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

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Brainstorming content ideas for you...</p>
        </div>
      )}

      {result && result.contentIdeas && result.contentIdeas.length > 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Generated Content Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.contentIdeas.map((idea, index) => (
                <li key={index} className="flex items-start p-3 bg-muted/50 rounded-md">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
