import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    useGetTaskByIdQuery, 
    useUpdateTaskMutation 
} from '../../services/taskApi';
import { 
    LuExternalLink, 
    LuCalendar, 
    LuChartBar, // Bạn đã đổi icon này, tôi giữ nguyên theo ý bạn
    LuUser,
    LuArrowLeft,
} from 'react-icons/lu';
import DashboardLayout from '../../components/layouts/DashboardLayout';



// --- Helper Component: Status Badge --- (Không đổi)
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800'; // Mặc định
    if (status === 'Pending') {
        colorClasses = 'bg-purple-100 text-purple-800';
    } else if (status === 'In Progress') {
        colorClasses = 'bg-blue-100 text-blue-800';
    } else if (status === 'Completed') {
        colorClasses = 'bg-green-100 text-green-800';
    }

    return (
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

// --- Helper Component: Info Item --- (Không đổi)
const InfoItem = ({ icon, label, children }) => (
    <div>
        <h4 className="flex items-center text-sm font-medium text-gray-500 mb-1">
            {icon}
            <span className="ml-2">{label}</span>
        </h4>
        <p className="text-base font-semibold text-gray-900">{children}</p>
    </div>
);

// --- Main Component: ViewTaskDetails ---
const ViewTaskDetails = () => {
    const { id } = useParams(); 
    const { data: task, isLoading, isError, error } = useGetTaskByIdQuery(id);
    const [updateTask] = useUpdateTaskMutation();

    const navigate = useNavigate();

    const handleChecklistToggle = async (checklistIndex) => {
        // <-- SỬA LỖI 1: Dùng 'todoCheckList'
        const newChecklist = task.todoCheckList.map((item, index) => {
            if (index === checklistIndex) {
                // Tên trường trong JSON là 'completed'
                return { ...item, completed: !item.completed }; 
            }
            return item;
        });

        try {
            // <-- SỬA LỖI 2: Gửi đi trường 'todoCheckList'
            await updateTask({ _id: task._id, todoCheckList: newChecklist }).unwrap();
        } catch (err) {
            console.error("Failed to update checklist:", err);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading task details...</div>;
    }
    if (isError) {
        return <div className="p-8 text-red-500">Error: {error.data?.message || 'Failed to load task'}</div>;
    }
    if (!task) {
        return <div className="p-8">Task not found.</div>;
    }

    return (
        <DashboardLayout>
            <div className="p-8 bg-white shadow-lg rounded-lg my-8">
                <header className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900">{task.title}</h2>               
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <LuArrowLeft />
                        Go Back
                    </button>
                </header>

                {/* 2. Description (Không đổi) */}
                <section className="mt-6">
                    <h3 className="flex text-sm font-medium text-gray-500 uppercase tracking-wide">Description
                        <div className="items-center gap-2 ml-auto">
                        <StatusBadge status={task.status} />
                    </div>
                    </h3>
                    <p className="mt-2 text-gray-700 leading-relaxed">
                        {task.description}
                    </p>
                    
                </section>

                {/* 3. Metadata Grid (Không đổi) */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                    <InfoItem label="Priority" icon={<LuChartBar />}>
                        <span 
                            className={
                                task.priority === 'High' ? 'text-red-600' :
                                task.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                            }
                        >
                            {task.priority}
                        </span>
                    </InfoItem>
                    
                    <InfoItem label="Due Date" icon={<LuCalendar />}>
                        {new Date(task.dueDate).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </InfoItem>

                    <div>
                        <h4 className="flex items-center text-sm font-medium text-gray-500 mb-2">
                            <LuUser />
                            <span className="ml-2">Assigned To</span>
                        </h4>
                        <div className="flex -space-x-2">
                            {task.assignedTo?.map((user) => (
                                <img
                                    key={user._id}
                                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                                    src={user.profileImageUrl}
                                    alt={user.name}
                                    title={user.name}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. Todo Checklist */}
                <section className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900">Todo Checklist</h3>
                    <div className="mt-4 space-y-3">
                        {/* <-- SỬA LỖI 3: Dùng 'todoCheckList' */}
                        {task.todoCheckList?.map((item, index) => (
                            <div key={item._id || index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <input
                                    id={`checklist-${index}`}
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={item.completed} // Tên trường 'completed' là đúng
                                    onChange={() => handleChecklistToggle(index)}
                                />
                                <label 
                                    htmlFor={`checklist-${index}`} 
                                    className={`ml-3 text-gray-800 ${item.completed ? 'text-gray-500' : ''}`}
                                >
                                    {item.text} {/* Tên trường 'text' là đúng */}
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. Attachments */}
                <section className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900">Attachments</h3>
                    <div className="mt-4 space-y-2">
                        {task.attachments?.map((attachment, index) => (
                            <a
                                key={index}
                                href={attachment} // Dùng 'attachment' trực tiếp vì nó là string
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-blue-600 hover:underline truncate">
                                    {/* <-- SỬA LỖI 4: Hiển thị 'attachment' vì nó là string */}
                                    {index + 1}. {attachment}
                                </span>
                                <LuExternalLink className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default ViewTaskDetails;