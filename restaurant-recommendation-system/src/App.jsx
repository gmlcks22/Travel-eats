import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import routes from "@utils/constants/routes";
import { getCurrentSession, clearCurrentSession } from "@utils/helpers/storage";

// Pages
import MainPage from "@pages/MainPage";
import LoginPage from "@pages/auth/LoginPage";
import RegisterPage from "@pages/auth/RegisterPage";
import GroupCreatePage from "@pages/group/GroupCreatePage";
import GroupJoinPage from "@pages/group/GroupJoinPage";
import GroupDetailPage from "@pages/group/GroupDetailPage";
import GroupManagePage from "@pages/group/GroupManagePage";
import TripPlanPage from "@pages/food/TripPlanPage";
import FoodPreferencePage from "@pages/food/FoodPreferencePage";
import LoadingPage from "@pages/food/LoadingPage";
import FoodResultPage from "@pages/food/FoodResultPage";
import FoodDetailPage from "@pages/food/FoodDetailPage";
import MyPage from "@pages/mypage/MyPage";
import MyGroupsPage from "@pages/mypage/MyGroupsPage";
import MyPageEdit from "@pages/mypage/MyPageEdit";

/**
 * ProtectedRoute 컴포넌트
 * - 사용자가 로그인한 경우에만 접근 가능한 라우트를 감싸는 역할
 * - 로그인하지 않은 경우 로그인 페이지로 리디렉션
 */
const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    // 사용자가 로그인하지 않았으면 로그인 페이지로 이동
    // state={{ from: location }} 등을 사용하여 로그인 후 원래 위치로 돌려보내는 로직 추가 가능
    return <Navigate to={routes.login} replace />;
  }
  return children;
};


/**
 * App 컴포넌트
 * - 애플리케이션의 메인 라우팅 및 세션 관리를 담당
 */
function App() {
  // 세션 상태 관리 (초기값은 로컬 스토리지에서 가져옴)
  const [session, setSession] = useState(getCurrentSession());

  // 세션 변경을 처리하는 핸들러
  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    clearCurrentSession(); // 로컬 스토리지에서 세션 삭제
    setSession(null); // 앱 상태 업데이트
  };

  // 다른 탭에서 로그아웃/로그인 시 상태 동기화를 위한 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = () => {
      setSession(getCurrentSession());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 라우트에 전달할 공통 props
  const commonPageProps = {
    session,
    token: session?.token,
    handleLogout,
  };

  return (
    <Router>
      <Routes>
        {/* 인증이 필요 없는 페이지 */}
        <Route 
          path={routes.login} 
          element={session ? <Navigate to={routes.home} replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path={routes.register} 
          element={session ? <Navigate to={routes.home} replace /> : <RegisterPage />} 
        />
        
        {/* 
          메인 페이지: 로그인 여부에 따라 다른 모습을 보여줄 수 있으므로 
          ProtectedRoute로 감싸지 않고 session 정보를 직접 전달
        */}
        <Route path={routes.home} element={<MainPage {...commonPageProps} />} />

        {/* 인증이 필요한 페이지 (ProtectedRoute 사용) */}
        <Route 
          path={routes.groupCreate} 
          element={<ProtectedRoute session={session}><GroupCreatePage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.groupJoin} 
          element={<ProtectedRoute session={session}><GroupJoinPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.groupDetail} 
          element={<ProtectedRoute session={session}><GroupDetailPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.groupManage} 
          element={<ProtectedRoute session={session}><GroupManagePage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.tripPlan} 
          element={<ProtectedRoute session={session}><TripPlanPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.foodPreference} 
          element={<ProtectedRoute session={session}><FoodPreferencePage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.loading} 
          element={<ProtectedRoute session={session}><LoadingPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.foodResult} 
          element={<ProtectedRoute session={session}><FoodResultPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.foodDetail} 
          element={<ProtectedRoute session={session}><FoodDetailPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.mypage} 
          element={<ProtectedRoute session={session}><MyPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.myGroups} 
          element={<ProtectedRoute session={session}><MyGroupsPage {...commonPageProps} /></ProtectedRoute>} 
        />
        <Route 
          path={routes.mypageEdit} 
          element={<ProtectedRoute session={session}><MyPageEdit {...commonPageProps} /></ProtectedRoute>} 
        />
        
        {/* 404 Not Found 또는 다른 경로 처리 */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
