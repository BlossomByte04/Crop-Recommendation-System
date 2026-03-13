"use client";

import { useState, useEffect } from "react";
import { getWeather, recommendCrop, submitFeedback } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, LocateFixed, ThermometerSun, Droplets, ArrowRight, CloudRain, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DISTRICT_COORDINATES } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    N: 80, P: 40, K: 40, temperature: 28, humidity: 65, rainfall: 120, district: "Belagavi", landSize: 1
  });
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [prediction, setPrediction] = useState<{ recommended_crop: string, confidence: number, top_3?: { crop: string, confidence: number }[] } | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load pre-filled OCR data if available
    const saved = localStorage.getItem("soilData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          N: parsed.N ?? prev.N,
          P: parsed.P ?? prev.P,
          K: parsed.K ?? prev.K,
        }));
      } catch (e) {}
    }
  }, []);

  const fetchWeatherForDistrict = async (districtName: string) => {
    const coords = DISTRICT_COORDINATES[districtName];
    if (!coords) return;

    setLoadingWeather(true);
    try {
      const weather = await getWeather(coords.lat, coords.lon);
      setFormData(prev => ({
        ...prev,
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall > 0 ? weather.rainfall * 30 : prev.rainfall
      }));
    } catch (error) {
      console.error("Failed to fetch district weather", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'district') {
      setFormData(prev => ({ ...prev, [name]: value }));
      fetchWeatherForDistrict(value);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: parseFloat(value) || 0 
      }));
    }
  };

  const handleGetLocationWeather = () => {
    if ("geolocation" in navigator) {
      setLoadingWeather(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weather = await getWeather(latitude, longitude);
          setFormData(prev => ({
            ...prev,
            temperature: weather.temperature,
            humidity: weather.humidity,
            rainfall: weather.rainfall > 0 ? weather.rainfall * 30 : prev.rainfall // approximate monthly
          }));
        } catch (error) {
          alert("Failed to fetch weather data.");
        } finally {
          setLoadingWeather(false);
        }
      }, () => {
        alert("Location permission denied.");
        setLoadingWeather(false);
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handlePredict = async () => {
    setLoadingPrediction(true);
    try {
      const result = await recommendCrop(formData);
      setPrediction(result);
      setFeedbackSubmitted({}); // Reset feedback status on new prediction
      localStorage.setItem("recommendedCrop", result.recommended_crop);
      localStorage.setItem("landSize", formData.landSize.toString());
    } catch (error) {
      alert("Prediction failed. Ensure backend is running.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleFeedback = async (crop: string, rating: number) => {
    try {
      await submitFeedback({
        crop,
        rating,
        comments: rating > 3 ? "Good prediction" : "Inaccurate prediction based on my region",
        inputs_used: formData
      });
      setFeedbackSubmitted(prev => ({ ...prev, [crop]: true }));
    } catch (e) {
      console.error("Failed to submit feedback", e);
    }
  };

  const handleChooseCrop = (cropName: string) => {
    localStorage.setItem("recommendedCrop", cropName);
    router.push(`/planner?crop=${cropName}`);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-slate-100">
        <Sprout className="text-green-600" />
        Crop Prediction Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-950 pb-4 border-b dark:border-slate-800">
              <CardTitle className="text-lg flex justify-between items-center">
                Soil Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {['N', 'P', 'K'].map(attr => (
                <div key={attr} className="space-y-2">
                  <Label htmlFor={attr}>{`${attr} (kg/ha)`}</Label>
                  <Input id={attr} name={attr} type="number" value={formData[attr as keyof typeof formData]} onChange={handleInputChange} className="bg-white dark:bg-slate-950" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-md dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-950 pb-4 border-b dark:border-slate-800">
              <CardTitle className="text-lg flex justify-between items-center">
                Climate Parameters
                <Button variant="outline" size="sm" onClick={handleGetLocationWeather} disabled={loadingWeather} className="h-8 text-xs flex gap-2">
                  <LocateFixed className="w-3 h-3" /> {loadingWeather ? "Tracking..." : "Use Current Location"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="flex items-center gap-1"><ThermometerSun className="w-3 h-3"/> Temp (°C)</Label>
                <Input id="temperature" name="temperature" type="number" step="0.1" value={formData.temperature} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity" className="flex items-center gap-1"><Droplets className="w-3 h-3"/> Humidity (%)</Label>
                <Input id="humidity" name="humidity" type="number" value={formData.humidity} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rainfall" className="flex items-center gap-1"><CloudRain className="w-3 h-3"/> Rain (mm)</Label>
                <Input id="rainfall" name="rainfall" type="number" value={formData.rainfall} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 col-span-3 md:col-span-2">
                <Label htmlFor="district" className="flex items-center gap-1"><LocateFixed className="w-3 h-3"/> District</Label>
                <select 
                  id="district" 
                  name="district" 
                  value={formData.district} 
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                >
                  {["Belagavi", "Dharwad", "Haveri", "Gadag", "Uttara Kannada", "Mysuru", "Mandya", "Tumkur", "Hassan", "Chikkamagaluru", "Raichur", "Koppal", "Ballari", "Vijayapura", "Yadgir", "Kalaburagi", "Bidar", "Chitradurga", "Davanagere", "Shivamogga"].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-3 md:col-span-1">
                <Label htmlFor="landSize" className="flex items-center gap-1">Land (Acres)</Label>
                <Input id="landSize" name="landSize" type="number" min="0.1" step="0.1" value={formData.landSize} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>
          
          <Button onClick={handlePredict} disabled={loadingPrediction} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
            {loadingPrediction ? "Running ML Model..." : "Predict Best Crop"}
          </Button>
        </div>

        <div>
          {prediction ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
              <div className="bg-green-500 text-white p-3 text-center text-sm font-semibold uppercase tracking-wider rounded-md shadow-md">
                Top 3 Recommendations
              </div>
              {prediction.top_3 ? prediction.top_3.map((rec, idx) => (
                <Card key={idx} className={`border-2 ${idx === 0 ? 'border-green-500 bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-slate-950 shadow-xl' : 'border-slate-200 dark:border-slate-800 shadow-sm'} overflow-hidden`}>
                  <CardContent className="p-6 text-center flex flex-col items-center relative">
                    <div className={`w-16 h-16 ${idx === 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'} rounded-full flex items-center justify-center mb-4`}>
                      <Sprout className={`w-8 h-8 ${idx === 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-1">{rec.crop}</h2>
                    <p className={`${idx === 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-500'} font-medium mb-6`}>Confidence: {(rec.confidence * 100).toFixed(1)}%</p>
                    
                    <div className="w-full space-y-3">
                      <Button onClick={() => handleChooseCrop(rec.crop)} variant={idx === 0 ? "default" : "outline"} className={`w-full ${idx === 0 ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900' : ''} group`}>
                        Choose {rec.crop} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      
                      {feedbackSubmitted[rec.crop] ? (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium pt-2 flex items-center justify-center gap-1">
                          ✓ Thanks for your feedback!
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-500">Helpful?</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-green-600 hover:bg-green-50" onClick={() => handleFeedback(rec.crop, 5)}>
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleFeedback(rec.crop, 1)}>
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="border-2 border-green-500 bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-slate-950 shadow-xl overflow-hidden">
                  <CardContent className="p-8 text-center flex flex-col items-center mt-6">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                      <Sprout className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">{prediction.recommended_crop}</h2>
                    <p className="text-green-600 dark:text-green-400 font-medium mb-8">Confidence: {(prediction.confidence * 100).toFixed(1)}%</p>
                    
                    <div className="w-full space-y-3">
                      <Button onClick={() => handleChooseCrop(prediction.recommended_crop)} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 group">
                        Generate Farming Plan <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      
                      {feedbackSubmitted[prediction.recommended_crop] ? (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium pt-2 flex items-center justify-center gap-1">
                          ✓ Thanks for your feedback!
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-500">Helpful?</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-green-600 hover:bg-green-50" onClick={() => handleFeedback(prediction.recommended_crop, 5)}>
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleFeedback(prediction.recommended_crop, 1)}>
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <Card className="h-full border-dashed flex items-center justify-center bg-transparent opacity-60">
              <CardContent className="p-8 text-center text-slate-400">
                <Sprout className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Fill out the parameters and click Predict to see the AI recommendation.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
