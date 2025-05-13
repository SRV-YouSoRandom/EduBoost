import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Lightbulb, MapPin, Building, BarChartBig, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "AI-Powered Local SEO",
    description: "Generate local SEO strategies tailored for educational institutions. Enhance your local search ranking and attract prospective students effectively.",
    icon: MapPin,
    link: "/local-seo",
  },
  {
    title: "GMB Optimizer",
    description: "Receive AI recommendations for your Google My Business profile. Optimize keywords and descriptions to improve visibility and engagement.",
    icon: Building,
    link: "/gmb-optimizer",
  },
  {
    title: "Performance Marketing Strategy",
    description: "Develop comprehensive performance marketing strategies. Identify key platforms and tactics to achieve your institution's marketing goals.",
    icon: BarChartBig,
    link: "/performance-marketing",
  },
  {
    title: "AI Content Idea Generator",
    description: "Create engaging content ideas that resonate with students, instructors, and parents. Fuel your content marketing with AI creativity.",
    icon: Lightbulb,
    link: "/content-ideas",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-accent/10">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">EduBoost</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container text-center">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium mb-6 text-primary">
              <Zap className="h-4 w-4 mr-2" /> AI-Powered Digital Marketing
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Boost Your Institution's <span className="text-primary">Online Presence</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
              EduBoost helps educational institutions attract the right audience and drive results through cutting-edge, AI-driven digital marketing solutions.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Launch EduBoost App</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="mt-16 relative">
              <Image 
                src="https://picsum.photos/seed/eduboost-dashboard/1200/600" 
                alt="EduBoost Dashboard Preview"
                width={1000}
                height={500}
                className="rounded-lg shadow-2xl mx-auto border-4 border-muted"
                data-ai-hint="dashboard analytics"
                priority
              />
               <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="text-3xl font-bold text-center text-foreground sm:text-4xl mb-4">
              Powerful Tools for Educational Growth
            </h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              Leverage AI to streamline your marketing efforts and achieve remarkable outcomes.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col bg-card">
                  <CardHeader className="items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4 inline-block">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <CardDescription className="text-center">{feature.description}</CardDescription>
                  </CardContent>
                  <CardContent className="text-center">
                     <Button variant="link" className="text-primary" asChild>
                        <Link href={feature.link}>Explore {feature.title.split(' ')[0]} &rarr;</Link>
                     </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-background">
        <div className="container text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EduBoost. All rights reserved.</p>
           <p className="text-sm mt-1">Empowering Education Through Innovation.</p>
        </div>
      </footer>
    </div>
  );
}
