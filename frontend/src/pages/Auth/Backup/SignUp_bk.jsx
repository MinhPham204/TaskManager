import React, {useState} from 'react'
import AuthLayout from '../../components/layouts/AuthLayout';
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import Input from '../../components/Inputs/Input';
import {Link, useNavigate} from 'react-router-dom';
const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState('');

  const [error, setError] = useState("null");
  const handleSignUp = async (e) => {
    e.preventDefault();

    if(!fullName) {
      setError("Please enter full name.");
      return;
    }
    if(!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if(!password){
      setError("Please enter the password");
      return;
    }
    setError("");

    // API Call
  };

  return (
    <AuthLayout>
      <div className="lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Create an Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Join us today by entering your details below.
        </p>
        <form action="" onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              value={fullName}
              onChange={({target}) => setFullName(target.value)}
              label="Full Name"
              placeholder="John"
              type="text"
              />
            <Input 
              value={email}
              onChange={({target}) => setEmail(target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
              />

            <Input 
              value={password}
              onChange={({target}) => setPassword(target.value)}
              label="Password"
              placeholder="Min 8 characters"
              type="password"

              />
            <Input 
              value={adminInviteToken}
              onChange={({target}) => setAdminInviteToken(target.value)}
              label="Admin Invite Token"
              placeholder=""
              type="text"

              />
              <div className="col-span-full p-0">
                {error && <p className="text-red-500 text-xs">{error}</p>}
              </div>
              <button type="submit" className="btn-primary">Sign Up</button>
              <p className="text-[13px] text-slate-800 mt-3">Already an account?{" "}
                <Link className="font-medium text-primary underline" to="/login">Login</Link>
              </p>
          </div>
        </form>
      </div>
    </AuthLayout>
      
  )
}

export default SignUp
