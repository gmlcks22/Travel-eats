import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getCurrentUser, getGroupById, updateGroup } from "@utils/helpers/storage";
import { MapPin, Calendar } from "lucide-react";

/**
 * 여행 계획 페이지
 * - 여행지 설정
 * - 여행 기간 설정
 * - 예상 예산 설정
 */
export default function TripPlanPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);
  
  // 여행 계획 state
  const [region, setRegion] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(50000);

  // 로그인 체크 - 마운트 시 한 번만
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // 그룹 정보 로드 - currentUser와 groupId가 준비되면
  useEffect(() => {
    if (!currentUser || !groupId) return;

    const groupData = getGroupById(groupId);
    if (!groupData) {
      alert("존재하지 않는 그룹입니다.");
      navigate(routes.home);
      return;
    }

    if (!groupData.members.includes(currentUser.id)) {
      alert("이 그룹의 멤버가 아닙니다.");
      navigate(routes.home);
      return;
    }

    setGroup(groupData);

    // 기존 계획이 있으면 불러오기
    if (groupData.tripPlan) {
      setRegion(groupData.tripPlan.region);
      setDays(groupData.tripPlan.days);
      setBudget(groupData.tripPlan.budget);
    }
  }, [currentUser, groupId, navigate]);

  // 여행 계획 저장
  const handleSavePlan = (e) => {
    e.preventDefault();

    if (!region.trim()) {
      alert("여행지를 입력해주세요.");
      return;
    }

    if (days < 1 || days > 10) {
      alert("여행 기간은 1일에서 10일 사이로 설정해주세요.");
      return;
    }

    const tripPlan = {
      region: region.trim(),
      days: parseInt(days),
      budget: parseInt(budget),
      mealsPerDay: 3, // 하루 3끼 기본
    };

    const result = updateGroup(groupId, { tripPlan });

    if (result.success) {
      alert("여행 계획이 저장되었습니다!");
      navigate(routes.foodPreference.replace(":groupId", groupId));
    } else {
      alert("저장에 실패했습니다.");
    }
  };

  if (!currentUser || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">여행 계획 수립</h1>
              <p className="text-gray-600">
                {group.name}의 여행 정보를 입력하세요
              </p>
            </div>

            {/* 여행 계획 폼 */}
            <form onSubmit={handleSavePlan} className="space-y-6">
              {/* 여행지 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  여행지
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="예: 제주도, 부산, 서울 등"
                  required
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* 여행 기간 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  여행 기간 (일)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-2xl font-bold text-indigo-600 min-w-[60px] text-center">
                    {days}일
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  총 {days * 3}끼 식사가 예상됩니다
                </p>
              </div>

              {/* 1인당 평균 예산 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  💰 1인당 평균 식사 예산
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-xl font-bold text-indigo-600 min-w-[120px] text-right">
                    {parseInt(budget).toLocaleString()}원
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  이 예산을 기준으로 식당을 추천합니다
                </p>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                <p className="text-sm text-indigo-800">
                  💡 <strong>다음 단계:</strong>
                  <br />
                  여행 계획 저장 후, 각 멤버가 음식 선호도를 입력하면 AI가 맞춤 식당을 추천합니다!
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  type="button"
                  onClick={() => navigate(routes.groupDetail.replace(":groupId", groupId))}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="flex-1"
                >
                  저장 및 계속하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}