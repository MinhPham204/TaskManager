import React, { useState } from 'react';
import { LuDownload, LuPlus } from 'react-icons/lu'; // Thêm icon Plus
import { useGetTasksQuery } from '../../services/taskApi';
import TaskCard from '../../components/Cards/TaskCard';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useSelector } from 'react-redux';
import { downloadReport } from '../../services/reportService';
import { STATUS_DATA } from '../../utils/data'; // Import danh sách status chuẩn
import { useNavigate } from 'react-router-dom';

const ManageTasks = () => {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('All');
    const { data: tasks, isLoading } = useGetTasksQuery();
    console.log("Dữ liệu tasks từ API:", tasks)

    // Lấy user từ auth state mới (đã có role và organizationId)
    const { user: authData } = useSelector((state) => state.auth);
    const currentUserRole = authData?.role;

    const [isDownloading, setIsDownloading] = useState(false);

    // Tạo danh sách Tab động từ STATUS_DATA
    const tabs = ['All', ...STATUS_DATA.map(s => s.value)];

    // Lọc task: Admin/Owner sẽ thấy toàn bộ task trả về từ API (BE đã filter theo Org)
    const filteredTasks = tasks?.filter(task => {
        if (currentTab === 'All') return true;
        return task.status === currentTab;
    });

    const getTabCount = (status) => {
        if (!tasks) return 0;
        if (status === 'All') return tasks.length;
        return tasks.filter(t => t.status === status).length;
    };

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            await downloadReport('tasks', 'task_report.xlsx');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="my-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentUserRole === 'owner' ? 'Organization Tasks' : 'Team Management'}
                        </h2>
                        <p className="text-sm text-gray-500">Manage, approve, and track all work progress.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => navigate('/admin/create-task')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                        >
                            <LuPlus className="w-5 h-5" />
                            Create Task
                        </button>
                        
                        <button 
                            onClick={handleDownloadReport}
                            disabled={isDownloading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <LuDownload className="w-5 h-5" />
                            {isDownloading ? '...' : 'Report'}
                        </button>
                    </div>
                </div>

                {/* Tab Bar - Cho phép scroll ngang trên mobile */}
                <div className="flex items-center border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setCurrentTab(tab)}
                            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
                                currentTab === tab
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                                currentTab === tab 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>{getTabCount(tab)}</span>
                            
                            {currentTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {filteredTasks && filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <TaskCard 
                                key={task._id} 
                                task={task} 
                                role={currentUserRole} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium">No tasks found in "{currentTab}"</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageTasks;