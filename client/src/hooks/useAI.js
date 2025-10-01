import { useState } from "react";
import apiClient from "../utils/apiClient";

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getInsights = async (detailLevel = "detailed") => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("useAI: Calling /ai/insights");
      const response = await apiClient.post("/ai/insights", { detailLevel });
      console.log("useAI: Response received:", response);
      console.log("useAI: Response data:", response.data);
      return response.data;
    } catch (err) {
      console.error("useAI: Error in getInsights:", err);
      console.error("useAI: Error response:", err.response);
      const errorMessage =
      err.response?.data?.message || "Failed to generate insights";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = async (focusArea = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/recommendations", {
        focusArea
      });
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message || "Failed to generate recommendations";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const queryData = async (question) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/query", { question });
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message || "Failed to process query";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const chat = async (message) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/chat", { message });
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message || "Failed to send message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/schedule-suggestions");
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message ||
      "Failed to generate schedule suggestions";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSkills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/skill-analysis");
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message || "Failed to analyze skills";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeeklyReport = async (startDate, endDate) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/ai/weekly-report", {
        startDate,
        endDate
      });
      return response.data;
    } catch (err) {
      const errorMessage =
      err.response?.data?.message || "Failed to generate weekly report";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getInsights,
    getRecommendations,
    queryData,
    chat,
    getScheduleSuggestions,
    analyzeSkills,
    getWeeklyReport
  };
};