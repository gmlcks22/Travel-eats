import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { CheckboxGroup, RangeInput } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getCurrentUser, updateUser } from "@utils/helpers/storage";
import { FOOD_CATEGORIES, FOOD_KEYWORDS } from "@utils/helpers/foodRecommendation";
import { Heart, ThumbsDown, X } from "lucide-react";

/**
 * 선호도 수정 페이지 (마이페이지 전용)
 * - 그룹과 무관하게 개인 선호도만 수정
 * - FoodPreferencePage와 유사하지만 그룹 컨텍스트 없음
 */
export default function PreferenceEditPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // 선호도 state
  const [likedCategories, setLikedCategories] = useState([]);
  const [dislikedCategories, setDislikedCategories] = useState([]);
  const [cannotEat, setCannotEat] = useState([]);
  const [dislikedKeywords, setDislikedKeywords] = useState([]);
  const [likedKeywords, setLikedKeywords] = useState([]);
  const [budgetRange, setBudgetRange] = useState([10000, 50000]);

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

  // 사용자 정보 로드 - currentUser가 설정되면 실행
  useEffect(() => {
    if (!currentUser) return;

    // 기존 선호도가 있으면 불러오기
    if (currentUser.preference) {
      const pref = currentUser.preference;
      setLikedCategories(pref.likedCategories || []);
      setDislikedCategories(pref.dislikedCategories || []);
      setCannotEat(pref.cannotEat || []);
      setDislikedKeywords(pref.dislikedKeywords || []);
      setLikedKeywords(pref.likedKeywords || []);
      setBudgetRange(pref.budgetRange || [10000, 50000]);
    }
  }, [currentUser]);

  // 선호도 저장
  const handleSavePreference = (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("로그인 정보를 찾을 수 없습니다.");
      return;
    }

    const preference = {
      likedCategories,
      dislikedCategories,
      cannotEat,
      dislikedKeywords,
      likedKeywords,
      budgetRange,
      updatedAt: new Date().toISOString(),
    };

    const result = updateUser(currentUser.id, { preference });

    if (result.success) {
      alert("선호도가 저장되었습니다!");
      navigate(routes.mypage);
    } else {
      alert("저장에 실패했습니다.");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const categories = Object.values(FOOD_CATEGORIES);
  const keywords = Object.values(FOOD_KEYWORDS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar />
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            {/* 타이틀 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">음식 선호도 수정</h1>
              <p className="text-gray-600">
                {currentUser.nickname}님의 음식 취향을 업데이트하세요
              </p>
            </div>

            {/* 선호도 폼 */}
            <form onSubmit={handleSavePreference} className="space-y-8">
              {/* 좋아하는 음식 카테고리 */}
              <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    좋아하는 음식 종류
                  </h2>
                </div>
                <CheckboxGroup
                  options={categories}
                  selected={likedCategories}
                  onChange={setLikedCategories}
                />
              </div>

              {/* 싫어하는 음식 카테고리 */}
              <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    선호하지 않는 음식 종류
                  </h2>
                </div>
                <CheckboxGroup
                  options={categories}
                  selected={dislikedCategories}
                  onChange={setDislikedCategories}
                />
              </div>

              {/* 못 먹는 음식 (알레르기 등) */}
              <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-800">
                    못 먹는 음식 (알레르기, 금기 등)
                  </h2>
                </div>
                <CheckboxGroup
                  options={keywords}
                  selected={cannotEat}
                  onChange={setCannotEat}
                />
                <p className="text-sm text-red-600 mt-3">
                  ⚠️ 이 항목은 추천에서 완전히 제외됩니다
                </p>
              </div>

              {/* 싫어하는 키워드 */}
              <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  피하고 싶은 맛/재료
                </h2>
                <CheckboxGroup
                  options={keywords}
                  selected={dislikedKeywords}
                  onChange={setDislikedKeywords}
                />
              </div>

              {/* 좋아하는 키워드 */}
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  선호하는 맛/재료
                </h2>
                <CheckboxGroup
                  options={keywords}
                  selected={likedKeywords}
                  onChange={setLikedKeywords}
                />
              </div>

              {/* 예산 범위 */}
              <div className="p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <RangeInput
                  label="💰 선호하는 가격대 (1인 평균)"
                  min={5000}
                  max={100000}
                  value={budgetRange}
                  onChange={setBudgetRange}
                  step={5000}
                />
              </div>

              {/* 안내 메시지 */}
              <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                <p className="text-sm text-indigo-800">
                  💡 <strong>알려드립니다:</strong>
                  <br />
                  • 변경된 선호도는 모든 그룹의 추천에 반영됩니다
                  <br />
                  • 못 먹는 음식이 있는 경우 반드시 체크해주세요!
                  <br />
                  • 선호도를 상세히 입력할수록 더 정확한 추천을 받을 수 있습니다
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  type="button"
                  onClick={() => navigate(routes.mypage)}
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
                  저장하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}