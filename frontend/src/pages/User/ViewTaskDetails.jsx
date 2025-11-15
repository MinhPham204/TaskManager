import React from 'react';
import { useParams } from 'react-router-dom';
import { 
    useGetTaskByIdQuery, 
    useUpdateTaskMutation 
} from '../../services/taskApi';
import { 
    LuExternalLink, 
    LuCalendar, 
    LuBarcode, 
    LuUser 
} from 'react-icons/lu';
import DashboardLayout from '../../components/layouts/DashboardLayout';

// --- Helper Component: Status Badge ---
// Component con để hiển thị trạng thái với màu sắc tương ứng
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

// --- Helper Component: Info Item ---
// Component con cho các mục Priority, Due Date
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
    const { id } = useParams(); // Lấy 'id' từ URL
    const { data: task, isLoading, isError, error } = useGetTaskByIdQuery(id);
    const [updateTask] = useUpdateTaskMutation();

    // Hàm xử lý khi bấm vào checkbox trong checklist
    const handleChecklistToggle = async (checklistIndex) => {
        // Tạo một mảng checklist mới
        const newChecklist = task.checklist.map((item, index) => {
            if (index === checklistIndex) {
                return { ...item, isCompleted: !item.isCompleted };
            }
            return item;
        });

        try {
            // Gửi bản cập nhật (chỉ checklist) lên server
            await updateTask({ _id: task._id, checklist: newChecklist }).unwrap();
        } catch (err) {
            console.error("Failed to update checklist:", err);
            // Bạn có thể thêm logic để thông báo lỗi cho user
        }
    };

    // Hiển thị trạng thái Loading và Error
    if (isLoading) {
        return <div className="p-8">Loading task details...</div>;
    }
    if (isError) {
        return <div className="p-8 text-red-500">Error: {error.data?.message || 'Failed to load task'}</div>;
    }
    if (!task) {
        return <div className="p-8">Task not found.</div>;
    }

    // --- Render Giao diện ---
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg my-8">
            {/* 1. Header: Title và Status */}
            <header className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900">{task.title}</h2>
                <StatusBadge status={task.status} />
            </header>

            {/* 2. Description */}
            <section className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Description</h3>
                <p className="mt-2 text-gray-700 leading-relaxed">
                    {task.description}
                </p>
            </section>

            {/* 3. Metadata Grid: Priority, Due Date, Assigned To */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <InfoItem label="Priority" icon={<LuBarcode />}>
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
                                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.name}`}
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
                    {task.todoCheckList?.map((item, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <input
                                id={`checklist-${index}`}
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={item.isCompleted}
                                onChange={() => handleChecklistToggle(index)}
                            />
                            <label 
                                htmlFor={`checklist-${index}`} 
                                className={`ml-3 text-gray-800 ${item.isCompleted ? 'line-through text-gray-500' : ''}`}
                            >
                                {item.task}
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
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                            <span className="text-blue-600 hover:underline truncate">
                                {index + 1}. {attachment.name || attachment.url}
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