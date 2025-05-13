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
import { Loader2, MapPin, SearchCheck, ListChecks, Link2, Settings2, Presentation, Target, FileText } from "lucide-react";
import { useInstitutions } from "@/contexts/InstitutionContext";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { cn } from "@/lib/utils";

import type { GenerateLocalSEOStrategyInput, GenerateLocalSEOStrategyOutput } from '@/ai/flows/generate-local-seo-strategy';
import { generateLocalSEOStrategy } from '@/ai/flows/generate-local-seo-strategy';


const formSchema = z.object({
  institutionName: z.string().min(2, "Institution name is required."),
  location: z.string().min(2, "Location is required."),
  programsOffered: z.string().min(10, "Programs offered description is too short."),
  targetAudience: z.string().min(10, "Target audience description is too short."),
  websiteUrl: z.string().url("Please enter a valid URL."),
});

const LOCAL_STORAGE_KEY_LOCAL_SEO = "localSeoResult";

const ListWithStatusDisplay: React.FC<{ title: string; items: ItemWithIdAndStatus[]; onStatusChange: (itemId: string, newStatus: Status) => void; listType?: 'keywordResearch' | 'kpis' }> = ({ title, items, onStatusChange, listType }) => {
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
              "flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-md border bg-card gap-3",
              getStatusSpecificStyling(item.status)
            )}
          >
            <span className="flex-1">{item.text}</span>
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


const SectionDisplay: React.FC<{ title: string; content?: string | Record<string, any>; icon?: React.ElementType; chartData?: any[]; chartType?: 'bar'; itemsWithStatus?: ItemWithIdAndStatus[]; onItemsStatusChange?: (listType: 'keywordResearch' | 'kpis', itemId: string, newStatus: Status) => void; keywordListType?: 'primaryKeywords' | 'secondaryKeywords' | 'longTailKeywords' }> = 
  ({ title, content, icon: Icon, chartData, chartType, itemsWithStatus, onItemsStatusChange, keywordListType }) => {
  if (!content && !chartData && (!itemsWithStatus || itemsWithStatus.length === 0)) return null;

  const renderContent = (data: string | Record<string, any>): React.ReactNode => {
    if (typeof data === 'string') {
      return <MarkdownDisplay content={data} asCard={false} className="text-sm"/>;
    }
    if (typeof data === 'object' && data !== null) {
      // Special handling for keywordResearch object which contains arrays of ItemWithStatus
      if (title === "Keyword Research" && 'primaryKeywords' in data && onItemsStatusChange) {
        const keywordData = data as GenerateLocalSEOStrategyOutput['keywordResearch'];
        return (
          <div className="space-y-4">
            <ListWithStatusDisplay title="Primary Keywords" items={keywordData.primaryKeywords} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} listType="keywordResearch" />
            <ListWithStatusDisplay title="Secondary Keywords" items={keywordData.secondaryKeywords} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} listType="keywordResearch" />
            <ListWithStatusDisplay title="Long-Tail Keywords" items={keywordData.longTailKeywords} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} listType="keywordResearch"/>
            {keywordData.toolsMention && <div><strong>Tools Mentioned:</strong> <MarkdownDisplay content={keywordData.toolsMention} asCard={false} className="text-sm inline"/></div>}
          </div>
        );
      }
      // Generic object rendering
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => {
             if (Array.isArray(value) && value.every(i => typeof i === 'object' && 'id' in i && 'text' in i && 'status' in i) && onItemsStatusChange) {
               // This case is for KPIs
               return <ListWithStatusDisplay key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} items={value as ItemWithIdAndStatus[]} onStatusChange={(id, status) => onItemsStatusChange('kpis', id, status)} listType="kpis"/>;
             }
            return (
              <div key={key}>
                <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </strong> 
                {renderContent(value as string | Record<string, any>)}
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
        {itemsWithStatus && onItemsStatusChange && keywordListType && (
           <ListWithStatusDisplay title="" items={itemsWithStatus} onStatusChange={(id, status) => onItemsStatusChange('keywordResearch', id, status)} />
        )}
         {title === "Tracking & Reporting" && typeof content === 'object' && content !== null && 'kpis' in content && Array.isArray((content as any).kpis) && onItemsStatusChange && (
            <ListWithStatusDisplay 
              title="Key Performance Indicators (KPIs)" 
              items={(content as any).kpis as ItemWithIdAndStatus[]} 
              onStatusChange={(id, status) => onItemsStatusChange('kpis', id, status)}
              listType="kpis"
            />
        )}


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
  const { activeInstitution } = useInstitutions();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateLocalSEOStrategyOutput | null>(null);

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

  useEffect(() => {
    if (activeInstitution) {
      form.reset({
        institutionName: activeInstitution.name,
        location: activeInstitution.location,
        programsOffered: activeInstitution.programsOffered,
        targetAudience: activeInstitution.targetAudience,
        websiteUrl: activeInstitution.websiteUrl || "",
      });
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_LOCAL_SEO);
    } else {
       form.reset({
        institutionName: "",
        location: "",
        programsOffered: "",
        targetAudience: "",
        websiteUrl: "",
      });
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY_LOCAL_SEO);
    }
  }, [activeInstitution, form]);

  useEffect(() => {
    const storedResult = localStorage.getItem(LOCAL_STORAGE_KEY_LOCAL_SEO);
    if (storedResult) {
       try {
        setResult(JSON.parse(storedResult));
      } catch (error) {
        console.error("Failed to parse stored local SEO results:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY_LOCAL_SEO);
      }
    }
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem(LOCAL_STORAGE_KEY_LOCAL_SEO, JSON.stringify(result));
    }
  }, [result]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_LOCAL_SEO);
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
    } finally {
      setIsLoading(false);
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

      if (listType === 'keywordResearch' && updatedResult.keywordResearch) {
        const mapKeywords = (keywords: ItemWithIdAndStatus[]) => 
          keywords.map(item => item.id === itemId ? { ...item, status: newStatus } : item);
        
        updatedResult.keywordResearch = {
          ...updatedResult.keywordResearch,
          primaryKeywords: mapKeywords(updatedResult.keywordResearch.primaryKeywords),
          secondaryKeywords: mapKeywords(updatedResult.keywordResearch.secondaryKeywords),
          longTailKeywords: mapKeywords(updatedResult.keywordResearch.longTailKeywords),
        };
      } else if (listType === 'kpis' && updatedResult.trackingReporting) {
        updatedResult.trackingReporting = {
          ...updatedResult.trackingReporting,
          kpis: updatedResult.trackingReporting.kpis.map(item =>
            item.id === itemId ? { ...item, status: newStatus } : item
          ),
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


  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="AI-Powered Local SEO Strategy"
        description="Provide details about your institution to generate a tailored local SEO strategy."
        icon={MapPin}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>Fill out the form below to get started. Select an institution or fill details manually.</CardDescription>
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
                        <Input placeholder="e.g., Springfield University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (City, State)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Springfield, IL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="programsOffered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programs Offered</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the main programs and courses offered..."
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
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your primary target audience (e.g., high school graduates, working professionals seeking certifications)..."
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
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://www.example.com" {...field} />
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
                  "Generate Local SEO Strategy"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && !result && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Generating your strategy, please wait...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 mt-8">
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
        </div>
      )}
      {result && !result.executiveSummary && !isLoading && (
         <Card className="mt-6 shadow-lg">
           <CardHeader><CardTitle>No Strategy Generated</CardTitle></CardHeader>
           <CardContent>
             <p>The AI could not generate a local SEO strategy based on the provided input. Please try refining your input or try again later.</p>
           </CardContent>
         </Card>
       )}
    </div>
  );
}
