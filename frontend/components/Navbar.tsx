import Link from "next/link";
import { Leaf, Menu } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <span className="text-xl font-bold tracking-tight text-green-900 dark:text-green-400">
            SmartCrop AI
          </span>
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link href="/upload" className="text-sm font-medium hover:text-green-600 transition-colors">
            Soil Card
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-green-600 transition-colors">
            Prediction
          </Link>
          <Link href="/planner" className="text-sm font-medium hover:text-green-600 transition-colors">
            Planner
          </Link>
          <Link href="/weather" className="text-sm font-medium hover:text-green-600 transition-colors">
            Weather
          </Link>
          <Link href="/chatbot" className="text-sm font-medium hover:text-green-600 transition-colors">
            AI Assistant
          </Link>
        </div>
        <div className="md:hidden">
          <Menu className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </nav>
  );
}
