"use client";

import { motion, Variants } from "framer-motion";
import { Leaf, CloudRain, Sun, Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-950 dark:to-green-950">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 dark:bg-green-700/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-300/20 dark:bg-emerald-800/20 rounded-full blur-3xl" />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 container mx-auto px-4 py-16 text-center"
      >
        <motion.div variants={item} className="mb-6 flex justify-center">
          <div className="p-4 rounded-3xl bg-green-100 dark:bg-green-900 shadow-xl shadow-green-900/10">
            <Leaf className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>
        
        <motion.h1 variants={item} className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Intelligence for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
            Next-Gen Farming
          </span>
        </motion.h1>
        
        <motion.p variants={item} className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300 mb-10">
          SmartCrop AI helps Karnataka farmers optimize crop selection, track weather risks, and plan 
          their harvest timeline with data-driven insights.
        </motion.p>
        
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/upload">
            <Button size="lg" className="w-full sm:w-auto text-lg rounded-full px-8 h-14 bg-green-600 hover:bg-green-700">
              Start with Soil Card
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg rounded-full px-8 h-14 border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950">
              Crop Prediction
            </Button>
          </Link>
        </motion.div>

        <motion.div variants={item} className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <FeatureCard 
            icon={<Sprout className="w-8 h-8 text-emerald-500" />}
            title="Crop Tasks Planner"
            desc="Detailed farming timeline based on the Karnataka Kharif dataset."
          />
          <FeatureCard 
            icon={<CloudRain className="w-8 h-8 text-blue-500" />}
            title="Weather Risk"
            desc="Real-time alerts comparing local weather to crop thresholds."
          />
          <FeatureCard 
            icon={<Sun className="w-8 h-8 text-amber-500" />}
            title="AI Multilingual Chat"
            desc="Speak to Gemini in Kannada, Hindi, and more."
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
