import { create } from 'zustand';

const useAssignmentsStore = create((set, get) => ({
  schedule: null,
  templates: [],
  preview: [],
  loading: false,
  error: null,

  loadSchedule: async (courseId) => {
    set({ loading: true, error: null });
    try {
      // Standardized to use snake_case for API consistency
      const res = await fetch(`/api/assignments/schedule?course_id=${courseId}`);
      if (!res.ok) throw new Error('Failed to load schedule');
      const data = await res.json();
      set({ schedule: data, loading: false });
      return data;
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  saveSchedule: async (payload) => {
    // The body of a POST request should also be snake_case if keys are being read on the backend
    const res = await fetch('/api/assignments/schedule', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });
    return res.json();
  },

  loadTemplates: async (courseId) => {
    // Standardized to use snake_case for API consistency
    const res = await fetch(`/api/assignments/templates?course_id=${courseId}`);
    const data = await res.json();
    set({ templates: data });
    return data;
  },

  createTemplate: async (payload) => {
    // The body of a POST request should also be snake_case
    const res = await fetch('/api/assignments/templates', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });
    return res.json();
  },

  loadPreview: async (courseId) => {
    // Standardized to use snake_case for API consistency
    const res = await fetch(`/api/assignments/preview?course_id=${courseId}`);
    const data = await res.json();
    set({ preview: data });
    return data;
  }
}));

export default useAssignmentsStore;