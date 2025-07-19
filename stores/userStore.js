import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  // State
  users: [],
  teachers: [],
  loading: false,
  error: null,
  
  // Actions
  setUsers: (users) => set({ users }),
  setTeachers: (teachers) => set({ teachers }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Fetch all users
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      set({ users: data, loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Fetch teachers specifically
  fetchTeachers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users/teachers');
      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }
      const data = await response.json();
      console.log('Teachers loaded from API:', data);
      set({ teachers: data, loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Get teachers from current users state
  getTeachersFromUsers: () => {
    const { users } = get();
    return users.filter(user => user.role === 'teacher');
  },
  
  // Add a new user
  addUser: (user) => set((state) => ({
    users: [...state.users, user],
    teachers: user.role === 'teacher' ? [...state.teachers, user] : state.teachers
  })),
  
  // Update a user
  updateUser: (userId, updatedUser) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, ...updatedUser } : user
    ),
    teachers: state.teachers.map(teacher => 
      teacher.id === userId ? { ...teacher, ...updatedUser } : teacher
    )
  })),
  
  // Remove a user
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(user => user.id !== userId),
    teachers: state.teachers.filter(teacher => teacher.id !== userId)
  })),
  
  // Clear all data
  clearUsers: () => set({ users: [], teachers: [], error: null }),
}));

export default useUserStore;