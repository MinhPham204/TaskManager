import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetTaskByIdQuery } from '../../services/taskApi';
import { useGetUsersQuery } from '../../services/userApi'; 
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuPlus, LuTrash2, LuArrowLeft, LuLink } from 'react-icons/lu';
import moment from 'moment';

const CreateTask = () => {
    const { taskId } = useParams();
    const isEditMode = !!taskId;
    const navigate = useNavigate();
    
    // RTK Query hooks
    const [createTask, { isLoading: isCreating, error: apiError }] = useCreateTaskMutation();
    const [updateTask, { isLoading: isUpdating}] = useUpdateTaskMutation();
    const [deleteTask, { isLoading: isDeleting}] = useDeleteTaskMutation();
    const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();
    const { data: existingTask, isLoading: isLoadingTask } = useGetTaskByIdQuery(
    taskId, 
    { skip: !isEditMode }
  );
    const isLoading = isCreating || isUpdating || isDeleting || isLoadingTask;
    // State for the entire form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium', 
        status: 'Pending',   
        dueDate: '',
        assignedTo: [],
        todoCheckList: [],
        attachments: [],
    });
    useEffect(() => {
    if (isEditMode && existingTask ) {
      setFormData({
        ...existingTask,
        dueDate: moment(existingTask.dueDate).format('YYYY-MM-DD'), 
      });
    }
  }, [isEditMode, existingTask]); // useEffect sẽ chạy lại khi các giá trị này thay đổi
  
    // State for the current checklist item input
    const [currentTodo, setCurrentTodo] = useState('');
    // State for the current link input
    const [currentLink, setCurrentLink] = useState('');

    // Convert user data for the Select component
    const userOptions = usersData?.map(user => ({ 
        value: user._id, 
        label: user.email,
        imageUrl: user.profileImageUrl })) || [];

    // Handler for regular input fields
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler for react-select (assigning users)
    const handleAssigneeChange = (selectedOptions) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setFormData({ ...formData, assignedTo: selectedIds });
    };
    
    // Handlers for the checklist
    const handleAddTodo = () => {
        if (currentTodo.trim() !== '') {
            const newTodo = { text: currentTodo, completed: false };
            setFormData({ ...formData, todoCheckList: [...formData.todoCheckList, newTodo] });
            setCurrentTodo('');
        }
    };
    
    const handleRemoveTodo = (index) => {
        const updatedTodos = formData.todoCheckList.filter((_, i) => i !== index);
        setFormData({ ...formData, todoCheckList: updatedTodos });
    };

    // NEW: Handlers for file links
    const handleAddLink = () => {
        if (currentLink.trim() !== '') {
            // Basic validation can be added here if needed
            setFormData({ ...formData, attachments: [...formData.attachments, currentLink] });
            setCurrentLink('');
        }
    };

    const handleRemoveLink = (index) => {
        const updatedLinks = formData.attachments.filter((_, i) => i !== index);
        setFormData({ ...formData, attachments: updatedLinks });
    };

    // Handler for form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try{
            if(isEditMode){
                await updateTask({ _id: taskId, ...formData }).unwrap();
                alert('Task update successfully!');
            }
            else{
                await createTask(formData).unwrap();
                alert('Task created successfully!');
                }
            navigate('/admin/tasks');
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId).unwrap();
        alert('Task deleted successfully!');
        navigate('/admin/tasks');
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

    return (
        <DashboardLayout activeMenu="Tasks">
            {/* Page Header */}
            <div className="flex justify-between items-center my-5">
                <h2 className="text-2xl font-semibold text-gray-800">{!isEditMode ? "Create New Task" : "Edit Task"}</h2>
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    <LuArrowLeft />
                    Go Back
                </button>
            </div>
            
            {/* Form Container */}
            <div className="card p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required 
                               className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium text-gray-700" />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" id="description" rows="4" value={formData.description} onChange={handleChange} required
                                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium text-gray-700"></textarea>
                    </div>

                    {/* Grid for other fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white border font-medium text-gray-700">
                                <option>Pending</option>
                                <option>In Progress</option>
                                <option>Completed</option>
                            </select>
                        </div>
                        {/* Priority */}
                        <div>
                             <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                            <select name="priority" id="priority" value={formData.priority} onChange={handleChange}
                                    className="select__control mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white border font-medium text-gray-700">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        {/* Due Date */}
                        <div>
                             <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required
                                   className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium text-gray-700" />
                        </div>
                        {/* AssignedTo */}
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
                            <Select
                                id="assignedTo"
                                isMulti
                                name="assignedTo"
                                options={userOptions}
                                isLoading={isLoadingUsers}
                                className="mt-1 basic-multi-select"
                                classNamePrefix="select"
                                onChange={handleAssigneeChange}
                                placeholder={isLoadingUsers ? "Loading..." : "Select members..."}
                            />
                        </div>
                    </div>
                    
                    {/* Checklist */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Sub-task Checklist</label>
                         <div className="mt-1 flex items-center gap-2">
                             <input type="text" value={currentTodo} onChange={(e) => setCurrentTodo(e.target.value)} 
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTodo(); } }}
                                    placeholder="Add a to-do item and press Enter..."
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                             <button type="button" onClick={handleAddTodo} className="flex-shrink-0 p-2 bg-gray-100 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                 <div className="flex text-sm"><LuPlus className="mr-3"size={20}/>Add </div>
                             </button>
                         </div>
                         <div className="mt-3 space-y-2">
                             {formData.todoCheckList.map((todo, index) => (
                                 <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md border-gray">
                                    <div className="flex items-center text-sm">
                                        <span className="font-semibold text-gray-400 mr-3">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-gray-700 font-medium">
                                            {todo.text}
                                        </span>
                                    </div>
                                     <button type="button" onClick={() => handleRemoveTodo(index)} className="text-red-500 hover:text-red-700">
                                         <LuTrash2 />
                                     </button>
                                 </div>
                             ))}
                         </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">File Links</label>
                        <div className="mt-1 flex items-center gap-2">
                            <input 
                                type="url" 
                                value={currentLink} 
                                onChange={(e) => setCurrentLink(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-medium text-gray-700" 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddLink} 
                                className="flex-shrink-0 p-2 bg-gray-100 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                              <div className="flex text-sm"><LuPlus className="mr-3"size={20}/>Add </div>
                                
                        
                            </button>
                        </div>
                        <div className="mt-3 space-y-2">
                            {formData.attachments.map((link, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline truncate ...">
                                        <LuLink className="inline-block mr-2" />
                                        {link}
                                    </a>
                                    <button type="button" onClick={() => handleRemoveLink(index)} className="text-red-500 hover:text-red-700 flex-shrink-0 ml-4">
                                        <LuTrash2 />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* API Error Display */}
                    {apiError && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            <p className="font-semibold">An error occurred:</p>
                            <p className="text-sm">{apiError.data?.message || 'Failed to create the task, please try again.'}</p>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="pt-4 flex justify-end gap-4">
                         <button type="button" onClick={() => navigate('/admin/tasks')} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                             Cancel
                         </button>
                        <button type="submit" disabled={isLoading} className="inline-flex justify-center px-6 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isCreating || isUpdating ? 'Saving...' : (isEditMode ? 'Update Task' : 'Save Task')}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default CreateTask;