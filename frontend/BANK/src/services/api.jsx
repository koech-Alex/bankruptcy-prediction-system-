import axios from "axios";

const API_URL = "http://localhost:5000";

export const analyzeCompany = (data) => axios.post(`${API_URL}/analyze`, data);
export const getHistory = () => axios.get(`${API_URL}/history`);
