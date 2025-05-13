import PageHeaderTitle from "@/components/common/page-header-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, MapPin, Building, BarChartBig } from 'lucide-react';

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
  return (
    <div className="space-y-8">
      <PageHeaderTitle
        title="Welcome to EduBoost!"
        description="Your AI-powered partner for digital marketing success in education. Select a tool below to get started."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className="h-7 w-7 text-primary" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Button asChild className="w-full mt-4">
                <Link href={feature.link}>{feature.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
