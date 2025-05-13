"use client";

import PageHeaderTitle from "@/components/common/page-header-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, MapPin, Building, BarChartBig, AlertTriangle, School, Brain, Zap, TrendingUp, FileText, PieChart, Activity } from 'lucide-react';
import { useInstitutions } from "@/contexts/InstitutionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useCallback } from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";

const features = [
  {
    title: "Local SEO Strategy",
    description: "Generate tailored local SEO strategies to boost your institution's visibility in local searches.",
    icon: MapPin,
    link: "/local-seo",
    cta: "Generate SEO Strategy",
    dataKey: "localSeoStrategies",
  },
  {
    title: "GMB Optimizer",
    description: "Optimize your Google My Business profile with AI-driven keyword and description suggestions.",
    icon: Building,
    link: "/gmb-optimizer",
    cta: "Optimize GMB Profile",
    dataKey: "gmbOptimizations",
  },
  {
    title: "Performance Marketing",
    description: "Develop effective performance marketing plans to reach your target audience and achieve goals.",
    icon: BarChartBig,
    link: "/performance-marketing",
    cta: "Create Marketing Plan",
    dataKey: "performanceMarketingStrategies",
  },
  {
    title: "Content Ideas",
    description: "Discover engaging content ideas that resonate with students, faculty, and parents.",
    icon: Lightbulb,
    link: "/content-ideas",
    cta: "Find Content Ideas",
    dataKey: "contentIdeas",
  },
];

interface StatsData {
  contentIdeas: number;
  gmbOptimizations: number;
  localSeoStrategies: number;
  performanceMarketingStrategies: number;
}

const PIE_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];


export default function DashboardPage() {
  const { activeInstitution, isLoading: isInstitutionLoading } = useInstitutions();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = useCallback(async (institutionId: string) => {
    setIsStatsLoading(true);
    try {
      const [
        contentIdeasRes,
        gmbOptimizationsRes,
        localSeoStrategiesRes,
        performanceMarketingStrategiesRes,
      ] = await Promise.all([
        supabase.from('content_ideas').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('gmb_optimizations').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('local_seo_strategies').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
        supabase.from('performance_marketing_strategies').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
      ]);

      // Check for errors in each response
      if (contentIdeasRes.error) throw new Error(`Content Ideas: ${contentIdeasRes.error.message}`);
      if (gmbOptimizationsRes.error) throw new Error(`GMB Optimizations: ${gmbOptimizationsRes.error.message}`);
      if (localSeoStrategiesRes.error) throw new Error(`Local SEO: ${localSeoStrategiesRes.error.message}`);
      if (performanceMarketingStrategiesRes.error) throw new Error(`Performance Marketing: ${performanceMarketingStrategiesRes.error.message}`);
      
      setStats({
        contentIdeas: contentIdeasRes.count ?? 0,
        gmbOptimizations: gmbOptimizationsRes.count ?? 0,
        localSeoStrategies: localSeoStrategiesRes.count ?? 0,
        performanceMarketingStrategies: performanceMarketingStrategiesRes.count ?? 0,
      });

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error Fetching Stats",
        description: (error as Error).message || "Could not load dashboard statistics.",
        variant: "destructive",
      });
      setStats(null); // Reset stats on error
    } finally {
      setIsStatsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeInstitution) {
      fetchStats(activeInstitution.id);
    } else {
      setStats(null); // Clear stats if no active institution
    }
  }, [activeInstitution, fetchStats]);


  const pageTitle = activeInstitution 
    ? `Dashboard for ${activeInstitution.name}` 
    : "Welcome to EduBoost!";
  
  const pageDescription = activeInstitution
    ? "Overview of your institution's marketing activities and AI usage. Select a tool to get started."
    : "Your AI-powered partner for digital marketing success in education. Please select or create an institution to begin.";

  const chartData = stats
    ? features.map(feature => ({
        name: feature.title,
        count: stats[feature.dataKey as keyof StatsData] > 0 ? 1 : 0, // Count as 1 if any data exists for the feature
      })).filter(item => item.count > 0) // Only show features with data for pie chart
    : [];
  
  const barChartData = stats
    ? features.map(feature => ({
        name: feature.title.split(" ")[0], // Short name for X-axis
        strategies: stats[feature.dataKey as keyof StatsData] > 0 ? 1 : 0, // Simplified for now, ideally count actual items
      }))
    : [];


  if (isInstitutionLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderTitle
          title="Loading Dashboard..."
          description="Please wait while we load your data."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {[1,2,3,4].map(i => (
            <Card key={i} className="shadow-lg flex flex-col">
              <CardHeader>
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-1" />
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title={pageTitle}
        description={pageDescription}
        icon={Brain}
      />
      
      {!activeInstitution && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <CardTitle>No Institution Selected</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                Please select an existing institution or create a new one to use the EduBoost tools and view statistics.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/institutions">
                <School className="mr-2 h-4 w-4" /> Manage Institutions
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeInstitution && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Activity Overview</CardTitle>
              <CardDescription>Number of strategies/optimizations generated per category.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              {isStatsLoading ? <Skeleton className="w-full h-full" /> : stats && barChartData.some(d => d.strategies > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={barChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} stroke="hsl(var(--foreground))"/>
                    <YAxis fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} stroke="hsl(var(--foreground))" allowDecimals={false}/>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", color: "hsl(var(--foreground))"}}/>
                    <Bar dataKey="strategies" name="Generated Items" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center pt-10">No activity data to display for {activeInstitution.name}. Start generating strategies!</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5 text-primary"/>Feature Usage</CardTitle>
              <CardDescription>Distribution of generated items across features.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              {isStatsLoading ? <Skeleton className="w-full h-full" /> : stats && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <RechartsPieChart data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                     <Legend wrapperStyle={{fontSize: "12px", color: "hsl(var(--foreground))"}} layout="vertical" verticalAlign="middle" align="right"/>
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                 <p className="text-muted-foreground text-center pt-10">No feature usage data yet.</p>
              )}
            </CardContent>
          </Card>
          
           {/* Placeholder for AI Usage Stats */}
          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Zap className="mr-2 h-5 w-5 text-primary"/>AI Usage Statistics (Placeholder)</CardTitle>
              <CardDescription>Track your Genkit API calls and token consumption.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground">API Calls Today</h4>
                <p className="text-2xl font-bold">N/A</p>
                <p className="text-xs text-muted-foreground">Integration required</p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground">Tokens Used (Month)</h4>
                <p className="text-2xl font-bold">N/A</p>
                <p className="text-xs text-muted-foreground">Integration required</p>
              </div>
            </CardContent>
             <CardContent>
                <p className="text-xs text-muted-foreground">Note: Displaying actual AI usage statistics requires backend integration with Genkit's monitoring or a similar system. This section is a placeholder for future development.</p>
             </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mt-8">
        {features.map((feature) => (
          <Card key={feature.title} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col ${!activeInstitution ? 'opacity-50 pointer-events-none' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className="h-7 w-7 text-primary" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Button asChild className="w-full mt-4" disabled={!activeInstitution}>
                <Link href={feature.link}>{feature.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
