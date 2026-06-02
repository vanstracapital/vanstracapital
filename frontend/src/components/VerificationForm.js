import React, { useState } from 'react';
import api from '../utils/api';

const VerificationForm = ({ onComplete }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('verifying');
    try {
      const res = await api.post('/verification/verify-code', { code });
      const { status: resp } = res.data;

      if (resp === 'continue') {
        setStatus('verifying');
        setTimeout(() => {
          setCode('');
          setStatus('idle');
          setMessage('');
        }, 2500);
      } else if (resp === 'complete') {
        setStatus('success');
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else if (resp === 'error') {
        setStatus('idle');
        setMessage('Invalid code. Please try again.');
      } else if (resp === 'locked') {
        setStatus('locked');
        setMessage('Too many failed attempts. Contact support.');
      } else {
        setStatus('idle');
        setMessage('Unexpected response');
      }
    } catch (err) {
      setStatus('idle');
      setMessage('An unexpected error occurred.');
    }
  };

  return (
    <div>
      <h2>Account Verification Required</h2>
      <p>Please enter the code provided by our support team.</p>

      {status === 'verifying' && <p>Verifying…</p>}

      {(status === 'idle' || status === 'error') && (
        <form onSubmit={handleSubmit}>
          {message && <p style={{ color: 'red' }}>{message}</p>}
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
          <button type="submit">Submit</button>
        </form>
      )}

      {status === 'locked' && <p>{message}</p>}
      {status === 'success' && <p>Verification Successful</p>}
    </div>
  );
};

export default VerificationForm;
