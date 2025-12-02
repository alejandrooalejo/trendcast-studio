import { TrendingUp, FileText, Library, Settings, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  { title: "Nova Análise", url: "/", icon: TrendingUp },
  { title: "Resultados", url: "/results", icon: FileText },
  { title: "Biblioteca", url: "/library", icon: Library },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FashionAI</span>
        </div>
      </SidebarHeader>
      
      <Separator />
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.url === "/"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">
          © 2024 FashionAI
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
