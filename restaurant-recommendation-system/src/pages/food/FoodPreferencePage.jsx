import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { CheckboxGroup, RangeInput } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getCurrentUser, updateUser, getGroupById } from "@utils/helpers/storage";
import { FOOD_CATEGORIES, FOOD_KEYWORDS } from "@utils/helpers/foodRecommendation";
import { Heart, ThumbsDown, X, AlertCircle } from "lucide-react";

/**
 * 음식 선호도 입력 페이지 (그룹 기반) - 중복 검사 기능 추가
 */
export default function FoodPreferencePage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [group, setGroup] = useState(null);

  // 선호도 state
  const [likedCategories, setLikedCategories] = useState([]);
  const [dislikedCategories, setDislikedCategories] = useState([]);
  const [cannotEat, setCannotEat] = useState([]);
  const [dislikedKeywords, setDislikedKeywords] = useState([]);
  const [likedKeywords, setLikedKeywords] = useState([]);
  const [budgetRange, setBudgetRange] = useState([0, 50000]);

  // 충돌 메시지 state - 각 섹션별로 분리
  const [conflicts, setConflicts] = useState({
    likedCategories: null,
    dislikedCategories: null,
    cannotEat: null,
    dislikedKeywords: null,
    likedKeywords: null,
  });

  // 로그인 체크
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate(routes.login);
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // 그룹 정보 및 선호도 로드
  useEffect(() => {
    if (!currentUser || !groupId) return;

    const groupData = getGroupById(groupId);
    if (!groupData) {
      alert("존재하지 않는 그룹입니다.");
      navigate(routes.home);
      return;
    }

    setGroup(groupData);

    if (currentUser.preference) {
      const pref = currentUser.preference;
      setLikedCategories(pref.likedCategories || []);
      setDislikedCategories(pref.dislikedCategories || []);
      setCannotEat(pref.cannotEat || []);
      setDislikedKeywords(pref.dislikedKeywords || []);
      setLikedKeywords(pref.likedKeywords || []);
      setBudgetRange(pref.budgetRange || [0, 50000]);
    }
  }, [currentUser, groupId, navigate]);

  // 충돌 검사 함수
  const checkConflicts = (type, value, newArray) => {
    let conflictMessage = null;

    if (type === 'liked') {
      if (dislikedCategories.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 선호하지 않는 음식으로 선택되어 있습니다.`;
      }
    } else if (type === 'disliked') {
      if (likedCategories.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 좋아하는 음식으로 선택되어 있습니다.`;
      }
    } else if (type === 'likedKeyword') {
      if (dislikedKeywords.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 피하고 싶은 맛/재료로 선택되어 있습니다.`;
      } else if (cannotEat.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 못 먹는 음식으로 선택되어 있습니다.`;
      }
    } else if (type === 'dislikedKeyword') {
      if (likedKeywords.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 선호하는 맛/재료로 선택되어 있습니다.`;
      } else if (cannotEat.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 못 먹는 음식으로 선택되어 있습니다.`;
      }
    } else if (type === 'cannotEat') {
      if (likedKeywords.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 선호하는 맛/재료로 선택되어 있습니다.`;
      } else if (dislikedKeywords.includes(value)) {
        conflictMessage = `"${value}"은(는) 이미 피하고 싶은 맛/재료로 선택되어 있습니다.`;
      }
    }

    return conflictMessage;
  };

  // 카테고리 선택 핸들러 (충돌 검사 포함)
  const handleLikedCategoriesChange = (newValue) => {
    const addedItem = newValue.find(item => !likedCategories.includes(item));
    
    if (addedItem) {
      const conflict = checkConflicts('liked', addedItem, newValue);
      if (conflict) {
        setConflicts(prev => ({ ...prev, likedCategories: conflict }));
        setTimeout(() => setConflicts(prev => ({ ...prev, likedCategories: null })), 3000);
        return;
      }
    }
    
    setLikedCategories(newValue);
    setConflicts(prev => ({ ...prev, likedCategories: null }));
  };

  const handleDislikedCategoriesChange = (newValue) => {
    const addedItem = newValue.find(item => !dislikedCategories.includes(item));
    
    if (addedItem) {
      const conflict = checkConflicts('disliked', addedItem, newValue);
      if (conflict) {
        setConflicts(prev => ({ ...prev, dislikedCategories: conflict }));
        setTimeout(() => setConflicts(prev => ({ ...prev, dislikedCategories: null })), 3000);
        return;
      }
    }
    
    setDislikedCategories(newValue);
    setConflicts(prev => ({ ...prev, dislikedCategories: null }));
  };

  // 키워드 선택 핸들러 (충돌 검사 포함)
  const handleLikedKeywordsChange = (newValue) => {
    const addedItem = newValue.find(item => !likedKeywords.includes(item));
    
    if (addedItem) {
      const conflict = checkConflicts('likedKeyword', addedItem, newValue);
      if (conflict) {
        setConflicts(prev => ({ ...prev, likedKeywords: conflict }));
        setTimeout(() => setConflicts(prev => ({ ...prev, likedKeywords: null })), 3000);
        return;
      }
    }
    
    setLikedKeywords(newValue);
    setConflicts(prev => ({ ...prev, likedKeywords: null }));
  };

  const handleDislikedKeywordsChange = (newValue) => {
    const addedItem = newValue.find(item => !dislikedKeywords.includes(item));
    
    if (addedItem) {
      const conflict = checkConflicts('dislikedKeyword', addedItem, newValue);
      if (conflict) {
        setConflicts(prev => ({ ...prev, dislikedKeywords: conflict }));
        setTimeout(() => setConflicts(prev => ({ ...prev, dislikedKeywords: null })), 3000);
        return;
      }
    }
    
    setDislikedKeywords(newValue);
    setConflicts(prev => ({ ...prev, dislikedKeywords: null }));
  };

  const handleCannotEatChange = (newValue) => {
    const addedItem = newValue.find(item => !cannotEat.includes(item));
    
    if (addedItem) {
      const conflict = checkConflicts('cannotEat', addedItem, newValue);
      if (conflict) {
        setConflicts(prev => ({ ...prev, cannotEat: conflict }));
        setTimeout(() => setConflicts(prev => ({ ...prev, cannotEat: null })), 3000);
        return;
      }
    }
    
    setCannotEat(newValue);
    setConflicts(prev => ({ ...prev, cannotEat: null }));
  };

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
      navigate(routes.loading.replace(":groupId", groupId));
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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">음식 선호도 입력</h1>
              <p className="text-gray-600">
                {currentUser.nickname}님의 음식 취향을 알려주세요
              </p>
              <p className="text-sm text-indigo-600 mt-1">
                그룹: {group.name}
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
                
                {/* 충돌 메시지 - 좋아하는 음식 */}
                {conflicts.likedCategories && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{conflicts.likedCategories}</p>
                  </div>
                )}
                
                <CheckboxGroup
                  options={categories}
                  selected={likedCategories}
                  onChange={handleLikedCategoriesChange}
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
                
                {/* 충돌 메시지 - 선호하지 않는 음식 */}
                {conflicts.dislikedCategories && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{conflicts.dislikedCategories}</p>
                  </div>
                )}
                
                <CheckboxGroup
                  options={categories}
                  selected={dislikedCategories}
                  onChange={handleDislikedCategoriesChange}
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
                
                {/* 충돌 메시지 - 못 먹는 음식 */}
                {conflicts.cannotEat && (
                  <div className="mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900 font-medium">{conflicts.cannotEat}</p>
                  </div>
                )}
                
                <CheckboxGroup
                  options={keywords}
                  selected={cannotEat}
                  onChange={handleCannotEatChange}
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
                
                {/* 충돌 메시지 - 피하고 싶은 맛/재료 */}
                {conflicts.dislikedKeywords && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{conflicts.dislikedKeywords}</p>
                  </div>
                )}
                
                <CheckboxGroup
                  options={keywords}
                  selected={dislikedKeywords}
                  onChange={handleDislikedKeywordsChange}
                />
              </div>

              {/* 좋아하는 키워드 */}
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  선호하는 맛/재료
                </h2>
                
                {/* 충돌 메시지 - 선호하는 맛/재료 */}
                {conflicts.likedKeywords && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{conflicts.likedKeywords}</p>
                  </div>
                )}
                
                <CheckboxGroup
                  options={keywords}
                  selected={likedKeywords}
                  onChange={handleLikedKeywordsChange}
                />
              </div>

              {/* 예산 범위 */}
              <div className="p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <RangeInput
                  label="💰 선호하는 가격대 (1인 평균)"
                  min={0}
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
                  <br />
                  • 중복된 항목은 자동으로 방지됩니다
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
                  저장 및 추천 받기
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 애니메이션을 위한 스타일 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}