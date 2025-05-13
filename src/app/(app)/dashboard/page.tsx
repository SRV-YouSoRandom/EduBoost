"use client";

import PageHeaderTitle from "@/components/common/page-header-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, MapPin, Building, BarChartBig, AlertTriangle, School } from 'lucide-react';
import { useInstitutions } from "@/contexts/InstitutionContext";
import { Skeleton } from "@/components/ui/skeleton";

const features = [
  {
    title: "Local SEO Strategy",
    description: "Generate tailored local SEO strategies to boost your institution's visibility in local searches.",
    icon: MapPin,
    link: "/local-seo",
    cta: "Generate SEO Strategy",
  },
  {
    title: "GMB Optimizer",
    description: "Optimize your Google My Business profile with AI-driven keyword and description suggestions.",
    icon: Building,
    link: "/gmb-optimizer",
    cta: "Optimize GMB Profile",
  },
  {
    title: "Performance Marketing",
    description: "Develop effective performance marketing plans to reach your target audience and achieve goals.",
    icon: BarChartBig,
    link: "/performance-marketing",
    cta: "Create Marketing Plan",
  },
  {
    title: "Content Ideas",
    description: "Discover engaging content ideas that resonate with students, faculty, and parents.",
    icon: Lightbulb,
    link: "/content-ideas",
    cta: "Find Content Ideas",
  },
];

export default function DashboardPage() {
  const { activeInstitution, isLoading } = useInstitutions();

  const pageTitle = activeInstitution 
    ? `Dashboard for ${activeInstitution.name}` 
    : "Welcome to EduBoost!";
  
  const pageDescription = activeInstitution
    ? "Select a tool below to get started with your selected institution."
    : "Your AI-powered partner for digital marketing success in education. Please select or create an institution to begin.";

  if (isLoading) {
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
      />
      
      {!activeInstitution && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-md">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            <div>
              <CardTitle>No Institution Selected</CardTitle>
              <CardDescription className="text-destructive-foreground/80">
                Please select an existing institution or create a new one to use the EduBoost tools.
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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
