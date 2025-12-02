import { TrendingUp, FileText, Library, Settings, Moon, Sun } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
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
    title: "Biblioteca", 
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
  const { theme, setTheme } = useTheme();
  
  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Sidebar className="border-r border-border bg-background w-64">
      <SidebarContent className="p-6 flex flex-col h-full">
        {/* Header da Sidebar */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground">
            FashionAI
          </h2>
        </div>

        <SidebarGroup className="flex-1">
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
                          flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors
                          ${active 
                            ? 'bg-muted text-foreground' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }
                        `}>
                          <item.icon 
                            className="h-5 w-5 flex-shrink-0"
                            strokeWidth={1.5}
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

        {/* Theme Toggle */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
            ) : (
              <Moon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
            )}
            <span className="text-sm font-medium">
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
