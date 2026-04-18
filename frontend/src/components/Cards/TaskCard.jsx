import React from 'react';
import { LuLink, LuMessageSquare, LuUsers } from 'react-icons/lu'; 
import { useNavigate } from 'react-router-dom';

const tagStyles = {
  status: {
    'Completed': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Pending Approval': 'bg-purple-100 text-purple-800',
    'Rejected': 'bg-red-100 text-red-800',            
  },
  priority: {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-orange-100 text-orange-800',
    'Low': 'bg-gray-100 text-gray-800',
  },
};

const TaskCard = ({ task, role }) => { 
  const { 
    _id, title, description, status, priority, 
    dueDate, assignedTo = [], todoCheckList = [], 
    team, progress: backendProgress 
  } = task;

  const navigate = useNavigate();

  // Tính toán tiến độ dựa trên Checklist 
  const completedTodo = todoCheckList.filter(st => st.completed).length;
  const totalTodo = todoCheckList.length;
  const progress = totalTodo > 0 ? (completedTodo / totalTodo) * 100 : backendProgress || 0;

  const handleCardClick = () => {
    // Owner và Admin đều vào trang Edit để quản lý/duyệt
    if (role === "admin" || role === "owner") {
      navigate(`/admin/tasks/edit/${_id}`);
    } else {
      navigate(`/user/task-detail/${_id}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full border border-gray-100 cursor-pointer relative"
    >
      {/* Header: Tags */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${tagStyles.status[status] || 'bg-gray-100'}`}>
            {status}
          </span>
          {/* Hiển thị Team Name nếu là Owner/Admin */}
          {(role === 'owner' || role === 'admin') && team && (
            <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-600 rounded">
              <LuUsers className="w-3 h-3" />
              {team.name}
            </span>
          )}
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold rounded ${tagStyles.priority[priority]}`}>
          {priority}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-md font-bold text-gray-800 line-clamp-1">{title}</h3>
      <p className="text-xs text-gray-500 mt-2 line-clamp-2 flex-grow">{description}</p>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className="text-gray-500 font-medium">Progress</span>
          <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-1.5 w-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${status === 'Completed' ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Footer: Assignees & Info */}
      <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-50">
        <div className="flex -space-x-2">
          {assignedTo.length > 0 ? (
            assignedTo.slice(0, 3).map((user, idx) => (
              <div 
                key={user._id || idx} 
                className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden"
                title={user.name}
              >
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-gray-500">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">Unassigned</span>
          )}
          {assignedTo.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-500">+{assignedTo.length - 3}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <div className="flex items-center gap-1">
            <LuMessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs">{task.comments?.length || 0}</span>
          </div>
          <div className="text-[10px] font-medium text-gray-500">
            {dueDate ? new Date(dueDate).toLocaleDateString('en-GB') : 'No date'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;