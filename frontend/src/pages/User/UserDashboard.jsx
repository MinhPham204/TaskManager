import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from "moment";
import { Box, CircularProgress, Typography } from '@mui/material'; 
import { useGetUserDashboardDataQuery } from '../../services/taskApi';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { addThousandsSeparator } from '../../utils/helper';
import InfoCard from '../../components/Cards/InfoCard';
import { LuArrowRight } from 'react-icons/lu';
import TaskListTable from '../../components/TaskListTable';
import CustomPieChart from '../../components/Charts/CustomPieChart';
import CustomBarChart from '../../components/Charts/CustomBarChart';

const COLORS = ["#8D51FF", "#00B8D8", "#7BCE00"];

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, isError } = useGetUserDashboardDataQuery();

  // TÍNH TOÁN DỮ LIỆU CHART BẰNG useMemo 
  const pieChartData = useMemo(() => {
    const taskDistribution = dashboardData?.charts?.taskDistribution || {};
    return [
      { status: "Pending", count: taskDistribution.Pending || 0 },
      { status: "In Progress", count: taskDistribution.InProgress || 0 },
      { status: "Completed", count: taskDistribution.Completed || 0 },
    ];
  }, [dashboardData]);

  const barChartData = useMemo(() => {
    const taskPriorityLevels = dashboardData?.charts?.taskPriorityLevels || {};
    return [
      { priority: "Low", count: taskPriorityLevels.Low || 0 },
      { priority: "Medium", count: taskPriorityLevels.Medium || 0 },
      { priority: "High", count: taskPriorityLevels.High || 0 },
    ];
  }, [dashboardData]);


  const onSeeMore = () => {
    navigate('/admin/tasks');
  }

  if (isLoading) {
    return (
      <DashboardLayout activeMenu="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
       <DashboardLayout activeMenu="Dashboard">
         <Typography color="error">Failed to load dashboard data.</Typography>
       </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="card my-5">
        <div className="grid">
          <div className="col-span-3">
            <h2 className="text-2xl font-semibold text-gray-800">Good Morning! {user?.name}</h2>
            <p className="text-xs md:text-[13px] text-gray-400 mt-1.5">
              {moment().format("dddd Do MMM YYYY")}
            </p>
          </div>
        </div>

        <div className="grid gir-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-5">
          <InfoCard
            label=" Total Tasks"
            value={addThousandsSeparator(
              dashboardData?.statistics?.totalTasks || 0
            )}
            color="bg-primary"
          />
          <InfoCard
            label=" Pending Tasks "
            value={addThousandsSeparator(
              dashboardData?.statistics?.pendingTasks || 0
            )}
            color="bg-yellow-500"
          />
          <InfoCard
            label=" In Progress Tasks "
            value={addThousandsSeparator(
              dashboardData?.charts?.taskDistribution?.InProgress || 0
            )}
            color="bg-cyan-500"
          />
          <InfoCard
            label=" Completed Tasks"
            value={addThousandsSeparator(
              dashboardData?.statistics?.completedTasks || 0
            )}
            color="bg-lime-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6">
        <div className="">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Task Distribution</h5>
            </div>
            <CustomPieChart data={pieChartData} colors={COLORS} />
          </div>
        </div>
        <div className="">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="font-medium">Task Priority Levels</h5>
            </div>
            <CustomBarChart data={barChartData} colors={COLORS} />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between">
              <h5 className="text-lg">Recent Tasks</h5>
              <button className="card-btn" onClick={onSeeMore}>See All <LuArrowRight className="text-base"/></button>
            </div>
            <TaskListTable tableData={dashboardData?.recentTasks || []}/>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard;