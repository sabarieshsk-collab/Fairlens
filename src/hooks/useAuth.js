import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only use mock auth if explicitly enabled via login
    if (localStorage.getItem('fairlens_mock_auth') === 'true') {
      setUser({ uid: 'mock-user-123', email: 'hr@example.com', displayName: 'HR Manager' });
      setLoading(false);
      return;
    }

    // Try to get actual Firebase user
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  }, []);

  return { user, loading, error };
}
