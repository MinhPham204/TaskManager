import React, {useState} from 'react';
import { LuDownload } from 'react-icons/lu';
import { useGetTasksQuery } from '../../services/taskApi';
import TaskCard from '../../components/Cards/TaskCard';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useSelector } from 'react-redux';
import { downloadReport } from '../../services/reportService';

const ManageTasks = () => {
    const [currentTab, setCurrentTab] = React.useState('All');
    const { data: tasks, isLoading, isError } = useGetTasksQuery();

    const { user: authData } = useSelector((state) => state.auth);
    const currentUserRole = authData?.role; 

    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);

    // Lọc danh sách task dựa trên tab hiện tại
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
      setDownloadError(null);
      try {
        await downloadReport('tasks', 'task_report.xlsx');
      } catch(err) {
        setDownloadError(err.message);
        alert(`Error: ${err.message}`);
      } finally {
        setIsDownloading(false);
      }
    };

    const tabs = ['All', 'Pending', 'In Progress', 'Completed'];

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <p>Loading...</p> To-do
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="my-5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800">My Tasks</h2>
                    <button 
                      onClick={handleDownloadReport}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors">
                        <LuDownload className="w-5 h-5" />
                        {isDownloading ? 'Downloading...' : 'Download Report'}
                    </button>
                </div>

                <div className="flex items-center border-b border-gray-200 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setCurrentTab(tab)}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${
                                currentTab === tab
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-blue-600'
                            }`}
                        >
                            {tab}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                currentTab === tab 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700'
                            }`}>{getTabCount(tab)}</span>
                        </button>
                    ))}
                </div>

                {filteredTasks && filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map(task => (
                            <TaskCard key={task._id} task={task} role={currentUserRole} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No tasks found for this category.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManageTasks;