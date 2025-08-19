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
      const res = await fetch(`/api/assignments/schedule?courseId=${courseId}`);
      const data = await res.json();
      set({ schedule: data, loading: false });
      return data;
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  saveSchedule: async (payload) => {
    const res = await fetch('/api/assignments/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res.json();
  },

  loadTemplates: async (courseId) => {
    const res = await fetch(`/api/assignments/templates?courseId=${courseId}`);
    const data = await res.json();
    set({ templates: data });
    return data;
  },

  createTemplate: async (payload) => {
    const res = await fetch('/api/assignments/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res.json();
  },

  loadPreview: async (courseId) => {
    const res = await fetch(`/api/assignments/preview?courseId=${courseId}`);
    const data = await res.json();
    set({ preview: data });
    return data;
  }
}));

export default useAssignmentsStore;
