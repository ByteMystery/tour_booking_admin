"use client";

import { Bell, Search, Sun, Moon, FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { admin, isDemoMode } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <FlaskConical className="h-3 w-3" />
            Demo Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-9 rounded-lg border border-input bg-muted pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-56"
          />
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Avatar */}
        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-indigo-500/20 transition-all hover:ring-indigo-500/50">
          <AvatarImage src={`https://i.pravatar.cc/100?u=${admin?.email}`} />
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
            {admin?.displayName?.charAt(0) ?? "A"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
