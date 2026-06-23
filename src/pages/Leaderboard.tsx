import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Medal, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardUser {
  id: string;
  name: string;
  photoURL: string;
  points: number;
  trustScore: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(20));
        const querySnapshot = await getDocs(q);
        const topUsers: LeaderboardUser[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          topUsers.push({
            id: doc.id,
            name: data.name || 'Anonymous',
            photoURL: data.photoURL || '',
            points: data.points || 0,
            trustScore: data.trustScore || 100
          });
        });
        setLeaders(topUsers);

        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          let userPoints = 0;
          if (userDoc.exists()) {
            const data = userDoc.data();
            userPoints = data.points || 0;
            setCurrentUserData({
              id: user.uid,
              name: data.name || user.displayName || 'Anonymous',
              photoURL: data.photoURL || user.photoURL || '',
              points: userPoints,
              trustScore: data.trustScore || 100
            });
            
            const rankQuery = query(collection(db, 'users'), where('points', '>', userPoints));
            const countSnapshot = await getCountFromServer(rankQuery);
            setCurrentUserRank(countSnapshot.data().count + 1);
          }
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (db) {
      fetchLeaderboard();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-card rounded-xl shadow-sm border border-border-subtle overflow-hidden mb-8">
        <div className="p-8 border-b border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3 text-dark">
              <Medal className="w-8 h-8 text-mint" />
              Community Leaderboard
            </h1>
            <p className="text-muted font-medium">Top contributors making the neighborhood better.</p>
          </div>
          
          {user && currentUserData && currentUserRank && (
            <div className="bg-page px-6 py-4 rounded-xl border border-border-subtle text-center min-w-[200px]">
              <p className="text-muted text-sm font-medium mb-1">Your Rank</p>
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <span className="text-dark">#{currentUserRank}</span>
              </div>
              <p className="text-xs text-muted mt-1">{currentUserData.points} points</p>
            </div>
          )}
        </div>

        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-page">
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-muted uppercase">Rank</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-muted uppercase">Citizen</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-muted uppercase text-right">Points</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-muted uppercase w-48">Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leaders.map((leader, index) => {
                  const isCurrentUser = user && user.uid === leader.id;
                  const isTop3 = index < 3;
                  return (
                    <motion.tr 
                      key={leader.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-page transition-colors ${isCurrentUser ? 'bg-mint/5 hover:opacity-10' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isTop3 ? (
                            <span className="w-8 h-8 rounded-full bg-mint/20 text-dark flex items-center justify-center font-bold shadow-sm">{index + 1}</span>
                          ) : (
                            <span className="w-8 h-8 rounded-full text-muted flex items-center justify-center font-bold">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-page overflow-hidden ring-2 ring-white">
                            {leader.photoURL ? (
                              <img src={leader.photoURL} alt={leader.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-page text-muted">
                                <UserIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                             <p className={`font-semibold text-sm ${isCurrentUser ? 'text-dark' : 'text-dark'} flex items-center gap-2`}>
                               {leader.name} {isCurrentUser && <span className="bg-mint text-dark text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">You</span>}
                             </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-bold text-dark">{leader.points}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="w-full bg-page rounded-full h-2.5 overflow-hidden">
                           <div 
                             className="bg-lavender h-2.5 rounded-full transition-all duration-1000" 
                             style={{ width: `${Math.min(100, Math.max(0, leader.trustScore))}%` }}
                             title={`${leader.trustScore}%`}
                           ></div>
                         </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {leaders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                      No citizens found on the leaderboard yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
