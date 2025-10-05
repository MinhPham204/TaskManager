import React, {useContext} from 'react'
import Navbar from './Navbar';
import SideMenu from './SideMenu';
import { setUser, clearUser, fetchProfile } from '../../store/authSlice';
import { useSelector, useDispatch } from 'react-redux';


const DashboardLayout = ({children, activeMenu}) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  return (
    <div className="">
      <Navbar activeMenu={activeMenu}/>
      {user && (
        <div className="flex">
          <div className="max-[1080px]:hidden">
            <SideMenu activeMenu={activeMenu}/>
          </div>

          <div className="grow mx-5">{children}</div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout

