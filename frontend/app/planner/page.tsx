"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { generateTaskPlan, generateDailyWorksheet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sprout, CalendarClock, IndianRupee, Sun, MessageSquare, ThumbsUp, ThumbsDown, Send, Calendar, Globe } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PlannerContent() {
  const searchParams = useSearchParams();
  const cropParam = searchParams?.get("crop");
  
  const [crop, setCrop] = useState<string>("");
  const [plan, setPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [landSize, setLandSize] = useState<number>(1);

  // Daily Worksheet State
  const [startDate, setStartDate] = useState<string>("");
  const [manualDay, setManualDay] = useState<string>("");
  const [worksheetData, setWorksheetData] = useState<any>(null);
  const [loadingWorksheet, setLoadingWorksheet] = useState(false);
  const [worksheetLanguage, setWorksheetLanguage] = useState<string>("English");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadPlan = async (cropName: string) => {
      setLoading(true);
      try {
        const data = await generateTaskPlan(cropName);
        if (data && data.plan) {
          setPlan(data.plan);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const c = cropParam || localStorage.getItem("recommendedCrop") || "Paddy";
    const size = parseFloat(localStorage.getItem("landSize") || "1");
    
    let currentHistory: any[] = [];
    const storedHistory = localStorage.getItem("cropFeedbackHistory");
    if (storedHistory) {
      try {
        currentHistory = JSON.parse(storedHistory);
        setFeedbackHistory(currentHistory);
      } catch (e) {}
    }

    const storedStart = localStorage.getItem("cropStartDate");
    if (storedStart) {
      setStartDate(storedStart);
    }

    const storedManualDay = localStorage.getItem("cropManualDay");
    if (storedManualDay) {
      setManualDay(storedManualDay);
    }

    const storedLang = localStorage.getItem("cropWorksheetLanguage");
    if (storedLang) {
      setWorksheetLanguage(storedLang);
    }

    const storedWorksheet = localStorage.getItem("cropWorksheetData");
    if (storedWorksheet) {
      try {
        setWorksheetData(JSON.parse(storedWorksheet));
      } catch (e) {}
    }

    setCrop(c);
    setLandSize(size);
    loadPlan(c);

    // Removed automatic generation on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropParam]);

  const totalCostPerAcre = plan.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalCost = totalCostPerAcre * landSize;

  const handleStartTracking = () => {
    if (!startDate && !manualDay) return alert("Please select a start date or enter current day number.");
    if (startDate) localStorage.setItem("cropStartDate", startDate);
    loadWorksheet(crop, startDate, worksheetLanguage, manualDay, feedbackHistory);
  };

  const loadWorksheet = async (currentCrop: string, start: string, lang: string, dayNum: string, history: any[]) => {
    setLoadingWorksheet(true);
    try {
      // Typically need user's coords, default to center of Karnataka (Hubli) if tracking fails
      const lat = 15.3647;
      const lon = 75.1240;
      let district = "Karnataka Region";
      
      const storedSoil = localStorage.getItem("soilData");
      if (storedSoil) {
         try {
           const parsed = JSON.parse(storedSoil);
           if (parsed.district) district = parsed.district;
         } catch(e) {}
      }

      const req: any = {
        crop: currentCrop,
        start_date: start || new Date().toISOString().split('T')[0], // Fallback if only dayNum is used
        district: district,
        latitude: lat,
        longitude: lon,
        language: lang,
        feedback_history: history
      };

      if (dayNum) {
        req.day_number = parseInt(dayNum);
      }
      
      const res = await generateDailyWorksheet(req);
      if (res.error) {
        alert(res.error);
      } else {
        setWorksheetData(res);
        localStorage.setItem("cropWorksheetData", JSON.stringify(res));
        if (dayNum) localStorage.setItem("cropManualDay", dayNum);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate daily worksheet.");
    } finally {
      setLoadingWorksheet(false);
    }
  };

  const submitDailyFeedback = () => {
    if (!feedbackInput || !feedbackRating) return alert("Please provide a rating and comment.");
    
    const newFeedback = {
      date: new Date().toISOString().split('T')[0],
      rating: feedbackRating,
      comments: feedbackInput
    };
    
    const updatedHistory = [...feedbackHistory, newFeedback];
    setFeedbackHistory(updatedHistory);
    localStorage.setItem("cropFeedbackHistory", JSON.stringify(updatedHistory));
    
    setFeedbackInput("");
    setFeedbackRating(0);
    alert("Feedback saved! It will be used by Gemini to generate tomorrow's worksheet.");
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 mb-2">
            <CalendarClock className="text-green-600" />
            Farming Task Planner
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Based on standard practices for <b className="text-green-700 dark:text-green-400">{crop}</b> ({landSize} Acres) in Karnataka Kharif season.
          </p>
        </div>
        
        {plan.length > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
                <IndianRupee className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-amber-900 dark:text-amber-500 font-semibold uppercase tracking-wider">Estimated Cost ({landSize} Ac)</p>
                <p className="text-xl font-bold text-amber-950 dark:text-amber-100">₹{totalCost.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="relative border-l-2 border-green-200 dark:border-green-900 ml-4 md:ml-6 space-y-8">
          {plan.map((task, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-10"
            >
              <div className="absolute -left-[11px] top-2 w-5 h-5 rounded-full bg-green-500 border-4 border-white dark:border-slate-950 shadow-sm" />
              
              <Card className="shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-green-600" />
                    {task.step}
                  </CardTitle>
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {task.window}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Govt Sowing Window:</span> {task.sowing}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Govt Harvest Window:</span> {task.harvest}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                    <span className="text-slate-500">Stage Cost</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">₹{task.cost}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {plan.length === 0 && !loading && (
             <div className="pl-8 text-slate-500">No planning data found for this crop in the dataset.</div>
          )}
        </div>
      )}

      {/* Daily Gemini Worksheet Section */}
      <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Sun className="text-amber-500" />
              Interactive Daily Worksheet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Get Gemini-powered day-by-day instructions adapted to weather & feedback.</p>
          </div>
          
          <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Start Date</Label>
              <div className="flex relative">
                 <Input 
                   id="startDate"
                   type="date"
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="pl-8 w-40"
                 />
                 <Calendar className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="manualDay" className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Current Day (Manual)</Label>
              <div className="flex relative">
                 <Input 
                   id="manualDay"
                   type="number"
                   placeholder="e.g. 45"
                   value={manualDay}
                   onChange={(e) => setManualDay(e.target.value)}
                   className="pl-8 w-32"
                 />
                 <CalendarClock className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="language" className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Plan Language</Label>
              <div className="flex relative">
                 <select 
                   id="language"
                   value={worksheetLanguage}
                   onChange={(e) => {
                     setWorksheetLanguage(e.target.value);
                     localStorage.setItem("cropWorksheetLanguage", e.target.value);
                   }}
                   className="flex h-10 w-36 items-center justify-between rounded-md border border-slate-200 bg-white px-8 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400"
                 >
                   <option value="English">English</option>
                   <option value="Kannada">Kannada</option>
                   <option value="Hindi">Hindi</option>
                   <option value="Telugu">Telugu</option>
                   <option value="Tamil">Tamil</option>
                 </select>
                 <Globe className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" />
              </div>
            </div>

            <Button onClick={handleStartTracking} disabled={loadingWorksheet} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
               {loadingWorksheet ? "Generating..." : "Generate Today"}
            </Button>
          </div>
        </div>

        {worksheetData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="border-green-200 dark:border-green-900/50 shadow-md">
                <CardHeader className="bg-green-50/50 dark:bg-green-950/20 border-b border-green-100 dark:border-green-900/50 pb-4">
                  <div className="flex justify-between items-center">
                     <div>
                       <p className="text-sm font-semibold text-green-600 dark:text-green-500 uppercase tracking-widest">Day {worksheetData.day_number}</p>
                       <CardTitle className="text-xl text-slate-800 dark:text-slate-100 mt-1">{worksheetData.current_stage}</CardTitle>
                     </div>
                     <div className="text-right text-sm text-slate-500 max-w-[50%]">
                       {worksheetData.weather}
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 prose dark:prose-invert max-w-none prose-green prose-h3:text-green-800 dark:prose-h3:text-green-400 prose-ul:pl-0 prose-li:list-none prose-li:mb-2 prose-li:flex prose-li:items-start checkbox-list">
                  <ReactMarkdown 
                    rehypePlugins={[rehypeRaw]} 
                    remarkPlugins={[remarkGfm]}
                  >
                    {worksheetData.worksheet_markdown}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="sticky top-6 bg-slate-50 dark:bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Daily Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Did you complete today&apos;s tasks? Were there any issues (pests, drought)? This will adapt tomorrow&apos;s worksheet.
                  </p>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Rate Today&apos;s Experience</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${feedbackRating === star ? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300 dark:bg-slate-800 dark:border-slate-700'}`}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="text-xs font-semibold text-slate-500 uppercase">Comments / Issues</Label>
                    <textarea 
                      id="comments"
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="e.g., Saw aphids today, couldn't finish irrigation because power failed..."
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400"
                    />
                  </div>
                  
                  <Button onClick={submitDailyFeedback} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Submit Updates <Send className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default function PlannerPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>}>
        <PlannerContent />
      </Suspense>
    </div>
  );
}
