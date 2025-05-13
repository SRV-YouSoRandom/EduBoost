
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarTrigger, SidebarRail } from "@/components/ui/sidebar";
import MainNav from "@/components/layout/main-nav";
import AppLogo from "@/components/layout/app-logo";
import UserNav from "@/components/layout/user-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstitutionProvider } from "@/contexts/InstitutionContext";
import InstitutionSelector from "@/components/common/InstitutionSelector";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <InstitutionProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen bg-background">
          <Sidebar 
            className="border-r bg-sidebar text-sidebar-foreground"
            collapsible="icon"
            variant="sidebar"
          >
            <SidebarHeader className="p-4 flex items-center justify-between h-16 border-b border-sidebar-border">
              <AppLogo />
            </SidebarHeader>
            <ScrollArea className="flex-1">
              <SidebarContent>
                <MainNav />
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          <SidebarRail />

          <SidebarInset className="flex flex-col flex-1">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <InstitutionSelector />
              </div>
              <div className="flex-1" /> {/* Spacer */}
              <UserNav />
            </header>
            <main className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </InstitutionProvider>
  );
}
