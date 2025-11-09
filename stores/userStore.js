
import { create } from 'zustand';

// This store acts as a client-side cache for user data.
// Actions here are responsible for both updating the local state (for UI responsiveness)
// and calling the backend API to persist changes.

const useUserStore = create((set, get) => ({
  // State
  users: [],
  loading: false,
  error: null,
  
  // Selectors
  getTeachers: () => {
    return get().users.filter(user => user.role === 'teacher');
  },
  getUserById: (id) => {
    return get().users.find(user => user.id === id);
  },

  // Actions
  fetchUsers: async (force = false) => {
    if (!force && get().users.length > 0) {
      return; // Avoid refetching if data is already present
    }
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      set({ users: data, loading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ error: error.message, loading: false });
    }
  },
  
  addUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      const newUser = await response.json();
      set((state) => ({ users: [...state.users, newUser], loading: false }));
      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateUser: async (userId, updatedData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH', // Using PATCH for partial updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      const updatedUser = await response.json();
      set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? updatedUser : user
        ),
        loading: false,
      }));
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  removeUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      set((state) => ({
        users: state.users.filter(user => user.id !== userId),
        loading: false,
      }));
    } catch (error) {
      console.error('Error removing user:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  promoteUser: async (userId, newRole) => {
    set({ loading: true, error: null });
    try {
        const response = await fetch(`/api/users/${userId}/promote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole }),
        });
        if (!response.ok) throw new Error('Failed to promote user');
        const updatedUser = await response.json();
        get().updateUser(userId, updatedUser); // Use existing update logic
        set({ loading: false });
        return updatedUser;
    } catch (error) {
        console.error('Error promoting user:', error);
        set({ error: error.message, loading: false });
        throw error;
    }
  },
}));

export default useUserStore;
