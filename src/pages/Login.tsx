import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider || !db) {
      setError("Firebase is not configured yet. Please add your credentials to the environment variables.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;

      // Check if user document already exists
      const userRef = doc(db, 'users', signedInUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          name: signedInUser.displayName || '',
          email: signedInUser.email || '',
          photoURL: signedInUser.photoURL || '',
          points: 0,
          trustScore: 50,
          role: "citizen",
          createdAt: serverTimestamp()
        });
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary px-6 py-10 text-center relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <h1 className="text-3xl font-bold text-white tracking-tight relative z-10">Civic Pulse</h1>
          <p className="text-blue-100 mt-2 text-sm relative z-10">Empowering communities to fix what matters</p>
        </div>
        
        <div className="p-8 flex flex-col gap-6">
          <p className="text-gray-600 text-center text-sm">
            Sign in to start reporting issues, voting on community priorities, and tracking neighborhood improvements.
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100 flex flex-col gap-2">
              <p>{error}</p>
              <p className="text-xs">Current domain: {window.location.hostname}</p>
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
