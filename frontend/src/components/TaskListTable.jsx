import React, { useState } from 'react'
import moment from 'moment';
import { LuCheck, LuX, LuSend } from 'react-icons/lu';
import { useSelector } from 'react-redux';
import {
  useSubmitForApprovalMutation,
  useApproveTaskMutation,
  useRejectTaskMutation,
} from '../services/taskApi';

const TaskListTable = ({ tableData }) => {
  const [rejectingTaskId, setRejectingTaskId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { user: authData } = useSelector((state) => state.auth);
  const [submitForApproval] = useSubmitForApprovalMutation();
  const [approveTask] = useApproveTaskMutation();
  const [rejectTask] = useRejectTaskMutation();

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-500 border border-green-200';
      case 'Pending': return 'bg-purple-100 text-purple-500 border border-purple-200';
      case 'In Progress': return 'bg-cyan-100 text-cyan-500 border border-cyan-200';
      case 'Pending Approval': return 'bg-yellow-100 text-yellow-600 border border-yellow-300';
      case 'Rejected': return 'bg-red-100 text-red-600 border border-red-300';
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-500 border border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-500 border border-orange-200';
      case 'Low': return 'bg-green-100 text-green-500 border border-green-200';
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const handleSubmitForApproval = async (taskId) => {
    try {
      await submitForApproval(taskId).unwrap();
      alert('Task submitted for approval');
    } catch (err) {
      alert('Failed to submit task for approval');
    }
  };

  const handleApprove = async (taskId) => {
    try {
      await approveTask({ taskId }).unwrap();
      alert('Task approved');
    } catch (err) {
      alert('Failed to approve task');
    }
  };

  const handleRejectSubmit = async (taskId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await rejectTask({ taskId, rejectionReason }).unwrap();
      alert('Task rejected');
      setRejectingTaskId(null);
      setRejectionReason('');
    } catch (err) {
      alert('Failed to reject task');
    }
  };

  const canSubmitForApproval = (task) => {
    return task.status === 'In Progress' && task.progress === 100;
  };

  const canApproveOrReject = (task) => {
    return task.status === 'Pending Approval' && ['owner', 'admin'].includes(authData?.role);
  };  

  return (
    <>
      <div className="overflow-x-auto p-0 rounded-lg mt-3">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Name</th>
              <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Status</th>
              <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Priority</th>
              <th className="py-3 px-4 text-gray-800 font-medium text-[13px] hidden md:table-cell">Created On</th>
              <th className="py-3 px-4 text-gray-800 font-medium text-[13px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((task) => (
              <tr key={task._id} className="border-t border-gray-200">
                <td className="my-3 mx-4 text-gray-700 text-[13px] line-clamp-1 overflow-hidden">{task.title}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 text-xs rounded inline-block ${getStatusBadgeColor(task.status)}`}>
                    {task.status}
                  </span>
                  {task.status === 'Rejected' && task.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">Reason: {task.rejectionReason}</div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 text-xs rounded inline-block ${getPriorityBadgeColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-700 text-[13px] text-nowrap hidden md:table-cell">
                  {task.createdAt ? moment(task.createdAt).format('Do MMM YYYY') : 'N/A'}
                </td>
                <td className="py-4 px-4 flex gap-2">
                  {/* Submit for Approval button */}
                  {canSubmitForApproval(task) && (
                    <button
                      onClick={() => handleSubmitForApproval(task._id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      title="Submit for approval"
                    >
                      <LuSend className="w-4 h-4" />
                    </button>
                  )}

                  {/* Approve button */}
                  {canApproveOrReject(task) && (
                    <button
                      onClick={() => handleApprove(task._id)}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      title="Approve task"
                    >
                      <LuCheck className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reject button */}
                  {canApproveOrReject(task) && (
                    <button
                      onClick={() => setRejectingTaskId(task._id)}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      title="Reject task"
                    >
                      <LuX className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject reason modal */}
      {rejectingTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Reject Task</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectingTaskId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectingTaskId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskListTable;
