import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Các state liên quan đến UI
  searchTerm: '',
  priorityFilter: 'All', 
  isTaskModalOpen: false,
  editingTaskId: null, 
};

const taskSlice = createSlice({
  name: 'tasks', 
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setPriorityFilter: (state, action) => {
      state.priorityFilter = action.payload;
    },
    openTaskModal: (state, action) => {
      state.isTaskModalOpen = true;
      state.editingTaskId = action.payload || null; 
    },
    closeTaskModal: (state) => {
      state.isTaskModalOpen = false;
      state.editingTaskId = null;
    },
  },
});

export const { 
  setSearchTerm, 
  setPriorityFilter, 
  openTaskModal, 
  closeTaskModal 
} = taskSlice.actions;

export default taskSlice.reducer;