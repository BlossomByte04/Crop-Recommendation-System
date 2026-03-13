import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const uploadSoilCard = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload_soil_card", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getWeather = async (lat: number, lon: number) => {
  const response = await api.get(`/get_weather?lat=${lat}&lon=${lon}`);
  return response.data;
};

export const recommendCrop = async (data: Record<string, unknown>) => {
  const response = await api.post("/predict_crop", data);
  return response.data;
};

export const generateTaskPlan = async (crop: string) => {
  const response = await api.post("/generate_task_plan", { crop });
  return response.data;
};

export const generateDailyWorksheet = async (data: Record<string, unknown>) => {
  const response = await api.post("/generate_daily_worksheet", data);
  return response.data;
};

export const checkCropRisk = async (data: Record<string, unknown>) => {
  const response = await api.post("/check_crop_risk", data);
  return response.data;
};

export const recommendFertilizer = async (data: Record<string, unknown>) => {
  const response = await api.post("/recommend_fertilizer", data);
  return response.data;
};

export const chatbotQuery = async (message: string, context: string, language: string = "en-IN") => {
  const response = await api.post("/chatbot_query", { message, context, language });
  return response.data;
};

export const submitFeedback = async (data: Record<string, unknown>) => {
  const response = await api.post("/submit_feedback", data);
  return response.data;
};

export default api;
