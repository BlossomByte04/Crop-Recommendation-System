"use client";

import { useState } from "react";
import { uploadSoilCard } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, UploadCloud, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await uploadSoilCard(file);
      setResults(data.extracted_values);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    // Save to localStorage so dashboard can pick it up
    if (results) {
      localStorage.setItem("soilData", JSON.stringify(results));
      router.push("/dashboard");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Leaf className="text-green-600" />
          Soil Health Card Reader
        </h1>
        
        <Card className="shadow-lg border-green-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <CardContent className="p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl m-6 hover:border-green-400 transition-colors">
            <UploadCloud className="w-16 h-16 text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
              Upload a clear photo of your soil health card to automatically extract Nitrogen, Phosphorus, Potassium, and pH values using AI.
            </p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="mb-4 text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 px-8"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing OCR...</> : "Analyze Card"}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-8">
            <Card className="border-green-200 dark:border-green-900 shadow-md">
              <CardHeader className="bg-green-50 dark:bg-green-950">
                <CardTitle className="text-green-800 dark:text-green-400">Extracted Soil Nutrients</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.entries(results).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-sm font-semibold text-slate-500 mb-1">{key === "ph" ? "pH" : `${key} (kg/ha)`}</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{val !== null ? String(val) : "—"}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setResults(null)}>Retake</Button>
                  <Button onClick={handleProceed} className="bg-green-600 hover:bg-green-700">Proceed to Crop Prediction</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
