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
    <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur">
      <SidebarContent className="gap-0 p-4">
        {/* Header da Sidebar */}
        <div className="px-3 py-6 mb-4 border-b border-border/40">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            FashionAI
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Análise de Tendências</p>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-0">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className="relative group w-full"
                      >
                        <div className={`
                          flex items-center gap-3.5 w-full px-4 py-3.5 rounded-lg transition-all duration-300
                          ${active 
                            ? 'bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10' 
                            : 'hover:bg-muted/60 border border-transparent'
                          }
                        `}>
                          <div className={`
                            flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                            ${active 
                              ? `bg-gradient-to-br ${item.gradient} shadow-md` 
                              : 'bg-muted/40 group-hover:bg-muted'
                            }
                          `}>
                            <item.icon 
                              className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                                active 
                                  ? 'text-white' 
                                  : 'text-muted-foreground group-hover:text-foreground'
                              }`}
                              strokeWidth={2}
                            />
                          </div>
                          <span className={`text-sm font-medium transition-all duration-300 ${
                            active 
                              ? 'text-foreground' 
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`}>
                            {item.title}
                          </span>
                          
                          {/* Active indicator */}
                          {active && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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
