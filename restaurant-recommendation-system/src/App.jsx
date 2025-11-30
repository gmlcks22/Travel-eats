import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "@utils/constants/routes";

// Pages
import MainPage from "@pages/MainPage";
import LoginPage from "@pages/auth/LoginPage";
import RegisterPage from "@pages/auth/RegisterPage";
import GroupCreatePage from "@pages/group/GroupCreatePage";
import GroupJoinPage from "@pages/group/GroupJoinPage";
import GroupDetailPage from "@pages/group/GroupDetailPage";
import TripPlanPage from "@pages/food/TripPlanPage";
import FoodPreferencePage from "@pages/food/FoodPreferencePage";
import LoadingPage from "@pages/food/LoadingPage";
import FoodResultPage from "@pages/food/FoodResultPage";
import FoodDetailPage from "@pages/food/FoodDetailPage";
import MyPage from "@pages/mypage/MyPage";
import MyPageEdit from "@pages/mypage/MyPageEdit";
import PreferenceEdit from "@pages/mypage/PreferenceEdit";

/**
 * App 컴포넌트
 * - 애플리케이션의 메인 라우팅을 관리
 * - React Router를 사용하여 페이지 간 네비게이션 구현
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* 메인 페이지 */}
        <Route path={routes.home} element={<MainPage />} />
        
        {/* 인증 관련 페이지 */}
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
        
        {/* 그룹 관련 페이지 */}
        <Route path={routes.groupCreate} element={<GroupCreatePage />} />
        <Route path={routes.groupJoin} element={<GroupJoinPage />} />
        <Route path={routes.groupDetail} element={<GroupDetailPage />} />
        
        {/* 여행 및 음식 추천 페이지 */}
        <Route path={routes.tripPlan} element={<TripPlanPage />} />
        <Route path={routes.foodPreference} element={<FoodPreferencePage />} />
        <Route path={routes.loading} element={<LoadingPage />} />
        <Route path={routes.foodResult} element={<FoodResultPage />} />
        <Route path={routes.foodDetail} element={<FoodDetailPage />} />
        
        {/* 마이페이지 */}
        <Route path={routes.mypage} element={<MyPage />} />
        <Route path={routes.mypageEdit} element={<MyPageEdit />} />
        <Route path={routes.preferenceEdit} element={<PreferenceEdit />} />
      </Routes>
    </Router>
  );
}

export default App;
