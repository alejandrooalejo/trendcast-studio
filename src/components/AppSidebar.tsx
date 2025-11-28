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
    gradient: "from-pink-400 via-rose-400 to-orange-400",
    bgGradient: "from-pink-500/10 to-orange-500/10"
  },
  { 
    title: "Análises", 
    url: "/analysis", 
    icon: FileText,
    gradient: "from-blue-400 via-cyan-400 to-teal-400",
    bgGradient: "from-blue-500/10 to-teal-500/10"
  },
  { 
    title: "Biblioteca de Produtos", 
    url: "/library", 
    icon: Library,
    gradient: "from-purple-400 via-violet-400 to-indigo-400",
    bgGradient: "from-purple-500/10 to-indigo-500/10"
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings,
    gradient: "from-emerald-400 via-green-400 to-lime-400",
    bgGradient: "from-emerald-500/10 to-lime-500/10"
  },
];

export function AppSidebar() {
  const location = useLocation();
  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar className="w-20 border-r border-border/50" collapsible="icon">
      <SidebarContent className="gap-3 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="relative group"
                      >
                        <div className={`
                          relative p-3 rounded-2xl transition-all duration-300
                          ${active 
                            ? `bg-gradient-to-br ${item.bgGradient} shadow-lg scale-105` 
                            : 'bg-muted/50 hover:bg-muted hover:scale-105'
                          }
                        `}>
                          <item.icon 
                            className={`h-6 w-6 transition-all duration-300 ${
                              active 
                                ? 'text-primary' 
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                            strokeWidth={active ? 2.5 : 2}
                          />
                          
                          {/* Glow effect for active */}
                          {active && (
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} opacity-20 blur-xl -z-10`} />
                          )}
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
