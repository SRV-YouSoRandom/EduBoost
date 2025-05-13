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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, BarChartBig } from "lucide-react";

import type { GeneratePerformanceMarketingStrategyInput, GeneratePerformanceMarketingStrategyOutput } from '@/ai/flows/generate-performance-marketing-strategy';
import { generatePerformanceMarketingStrategy } from '@/ai/flows/generate-performance-marketing-strategy';

const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  institutionType: z.string().min(2, "Institution type is required."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  programmesOffered: z.string().min(10, "Programmes offered description is too short."),
  location: z.string().min(2, "Location is required."),
  marketingBudget: z.string().min(1, "Marketing budget is required (e.g., $5000, Flexible)."),
  marketingGoals: z.string().min(10, "Marketing goals description is too short."),
});

export default function PerformanceMarketingPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratePerformanceMarketingStrategyOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institutionName: "",
      institutionType: "",
      targetAudience: "",
      programmesOffered: "",
      location: "",
      marketingBudget: "",
      marketingGoals: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
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
          <CardDescription>Complete the form to get your AI-generated strategy.</CardDescription>
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
                        <Input placeholder="e.g., Metropolis University" {...field} />
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
                        <Input placeholder="e.g., University, College, Vocational School" {...field} />
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
                        placeholder="Describe your primary target audience for marketing..."
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
                name="programmesOffered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programmes Offered</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List or describe key programmes relevant to marketing efforts..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (City, State)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Metropolis, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marketingBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $10,000/month, Project-based" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="marketingGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are the main objectives? (e.g., increase student enrollment by 15%, improve brand awareness, promote new online courses)..."
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
                    Generating Strategy...
                  </>
                ) : (
                  "Generate Performance Marketing Strategy"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Crafting your performance marketing strategy...</p>
        </div>
      )}

      {result && result.marketingStrategyDocument && (
        <MarkdownDisplay title="Generated Performance Marketing Strategy" content={result.marketingStrategyDocument} />
      )}
    </div>
  );
}
