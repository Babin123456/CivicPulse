import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Clock, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'reports'),
      where('reporterId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in JS instead of Firestore to avoid requiring a composite index immediately
      data.sort((a: any, b: any) => {
         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return tB - tA;
      });
      setReports(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-4">
        <div className="bg-primary h-24"></div>
        <div className="px-6 flex flex-col items-center -mt-12 mb-6">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-4xl text-gray-300">
             {user?.photoURL ? (
               <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                 <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
               </svg>
             )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{user?.displayName || 'My Profile'}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Reports</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't reported any issues yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <Link key={report.id} to={`/issue/${report.id}`} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-24 h-24 sm:h-auto bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {report.mediaType === 'video' ? (
                     <video src={report.mediaURL} className="w-full h-full object-cover" />
                  ) : (
                     <img src={report.mediaURL} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">{report.category}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                       report.status === 'reported' ? 'bg-red-100 text-red-700' :
                       report.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                       report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                       'bg-gray-100 text-gray-700'
                     }`}>
                       {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{report.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button 
          onClick={handleSignOut}
          className="text-red-500 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
