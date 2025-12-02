import { TrendingUp, FileText, Library, Settings } from "lucide-react";
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
} from "@/components/ui/sidebar";

const navigationItems = [
  { 
    title: "Tendências", 
    url: "/", 
    icon: TrendingUp,
  },
  { 
    title: "Análises", 
    url: "/analysis", 
    icon: FileText,
  },
  { 
    title: "Biblioteca", 
    url: "/library", 
    icon: Library,
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r border-border bg-card w-60">
      <SidebarContent className="p-5">
        {/* Header */}
        <div className="mb-8 px-2">
          <h2 className="text-xl font-display font-semibold text-foreground tracking-tight">
            FashionAI
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Inteligência de Moda</p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-0">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="w-full"
                      >
                        <div className={`
                          flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200
                          ${active 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}>
                          <item.icon 
                            className="h-[18px] w-[18px] flex-shrink-0"
                            strokeWidth={active ? 2 : 1.5}
                          />
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
