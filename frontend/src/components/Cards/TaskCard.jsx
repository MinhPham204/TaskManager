// src/components/Cards/TaskCard.jsx

import React from 'react';
import { LuLink, LuMessageSquare } from 'react-icons/lu'; 
import { useNavigate } from 'react-router-dom';

const tagStyles = {
  status: {
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
  },
  priority: {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-orange-100 text-orange-800',
    Low: 'bg-gray-100 text-gray-800',
  },
};

const TaskCard = ({ task, role }) => { 
  const { title, description, status, priority, startDate, dueDate, assignedTo = [], todoCheckList = [] } = task;

  const navigate = useNavigate();
  // Tính toán tiến độ
  const completedtodoCheckList = todoCheckList.filter(st => st.isCompleted).length;
  const totaltodoCheckList = todoCheckList.length;
  const progress = totaltodoCheckList > 0 ? (completedtodoCheckList / totaltodoCheckList) * 100 : 0;

  const handleCardClick = () => {
    if(role === "admin"){
      navigate(`/admin/tasks/edit/${task._id}`);
    }
    else {
      navigate(`/user/task-detail/${task._id}`);
    }
  }
  return (
    <div 
    onClick={handleCardClick}
    className="bg-white p-5 rounded-lg shadow-md flex flex-col h-full border border-gray-100 cursor-pointer">
      {/* Header: Tags */}
      <div className="flex justify-between items-center mb-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-md ${tagStyles.status[status]}`}>
          {status}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-md ${tagStyles.priority[priority]}`}>
          {priority} Priority
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-bold text-gray-800 mt-2">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 flex-grow">{description}</p>

      {/* Progress Bar */}
      <div className="mt-4">
        <p className="text-xs text-gray-500">Task Done: {completedtodoCheckList} / {totaltodoCheckList}</p>
        <div className="bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className="bg-blue-600 h-1.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Dates */}
      <div className="flex justify-between mt-4">
        <div>
          <p className="text-xs text-gray-500">Start Date</p>
          <p className="text-sm font-medium text-gray-700">{new Date(startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Due Date</p>
          <p className="text-sm font-medium text-gray-700">{new Date(dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer: Assignees & Icons */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
        <div className="flex -space-x-2">
          {assignedTo.slice(0, 3).map(user => (
            <img
              key={user._id}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              src={user.profileImageUrl}
              alt={user.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex items-center gap-1">
            <LuLink className="w-4 h-4" />
            <span className="text-sm">{task.attachments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <LuMessageSquare className="w-4 h-4" />
            <span className="text-sm">{task.comments?.length || 2}</span> {/* Giả sử có 2 comment */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;