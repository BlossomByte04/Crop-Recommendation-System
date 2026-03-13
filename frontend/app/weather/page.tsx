"use client";

import { useState, useEffect } from "react";
import { getWeather } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, CloudSun, Thermometer, Droplets, LocateFixed, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DISTRICT_COORDINATES } from "@/lib/constants";
import { Label } from "@/components/ui/label";

export default function WeatherPage() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  useEffect(() => {
    handleGetLocationWeather();
  }, []);

  const handleGetLocationWeather = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setSelectedDistrict(""); // Clear manual district selection
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await getWeather(latitude, longitude);
          setWeather(data);
        } catch (error) {
          console.error(error);
          alert("Failed to fetch weather for your location.");
        } finally {
          setLoading(false);
        }
      }, () => {
        setLoading(false);
        alert("Location access denied.");
      });
    }
  };

  const handleDistrictWeather = async (districtName: string) => {
    if (!districtName) return;
    const coords = DISTRICT_COORDINATES[districtName];
    if (!coords) return;

    setLoading(true);
    setSelectedDistrict(districtName);
    try {
      const data = await getWeather(coords.lat, coords.lon);
      setWeather(data);
    } catch (error) {
      console.error(error);
      alert(`Failed to fetch weather for ${districtName}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 mb-2">
            <CloudSun className="text-blue-500" />
            Weather Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Current conditions at your farm location.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="district" className="text-xs text-slate-500 font-semibold uppercase">Search District</Label>
            <div className="flex relative">
              <select 
                id="district" 
                value={selectedDistrict} 
                onChange={(e) => handleDistrictWeather(e.target.value)}
                className="flex h-10 w-56 rounded-md border border-slate-200 bg-white px-8 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">Select District...</option>
                {Object.keys(DISTRICT_COORDINATES).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <Globe className="w-4 h-4 absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>

          <Button onClick={handleGetLocationWeather} disabled={loading} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-slate-900">
            <LocateFixed className="w-4 h-4 mr-2" />
            {loading ? "Updating..." : "Use My Location"}
          </Button>
        </div>
      </div>

      {!weather && !loading && (
        <Card className="border-dashed h-40 flex items-center justify-center bg-transparent">
          <p className="text-slate-400">Allow location access to view local weather.</p>
        </Card>
      )}

      {loading && !weather && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {weather && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.0 }}>
            <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-amber-950/30 border-amber-200 dark:border-amber-900/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 dark:text-amber-400 flex items-center gap-2 text-base uppercase tracking-wider">
                  <Thermometer className="w-5 h-5" /> Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-light tracking-tighter text-amber-950 dark:text-amber-100">
                  {weather.temperature}°<span className="text-3xl font-medium text-amber-700/60 dark:text-amber-500/60">C</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-slate-900 dark:to-cyan-950/30 border-cyan-200 dark:border-cyan-900/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-800 dark:text-cyan-400 flex items-center gap-2 text-base uppercase tracking-wider">
                  <Droplets className="w-5 h-5" /> Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-light tracking-tighter text-cyan-950 dark:text-cyan-100">
                  {weather.humidity}<span className="text-3xl font-medium text-cyan-700/60 dark:text-cyan-500/60">%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-slate-900 dark:to-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-indigo-800 dark:text-indigo-400 flex items-center gap-2 text-base uppercase tracking-wider">
                  <CloudRain className="w-5 h-5" /> Hourly Rain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-light tracking-tighter text-indigo-950 dark:text-indigo-100">
                  {weather.rainfall}<span className="text-3xl font-medium text-indigo-700/60 dark:text-indigo-500/60">mm</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
