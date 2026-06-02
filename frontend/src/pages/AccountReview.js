import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import VerificationForm from '../components/VerificationForm';

const AccountReview = () => {
  const navigate = useNavigate();
  const { setRestricted } = useContext(AuthContext);

  const handleComplete = () => {
    // once verified, clear the restricted flag and go to dashboard
    setRestricted(false);
    navigate('/dashboard');
  };

  return (
    <div>
      <h1>Account Review</h1>
      <VerificationForm onComplete={handleComplete} />
    </div>
  );
};

export default AccountReview;
