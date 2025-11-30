import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { CheckboxGroup, RangeInput } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getGroupById, updateUser } from "@utils/helpers/storage";
import {
  FOOD_CATEGORIES,
  FOOD_KEYWORDS,
} from "@utils/helpers/foodRecommendation";
import { Heart, ThumbsDown, SkipForward } from "lucide-react";

/**
 * 음식 선호도 입력 페이지
 * - 온보딩(groupId 없음)과 그룹 내(groupId 있음) 두 가지 케이스를 모두 처리
 * - 좋아하는 음식 종류와 선호하지 않는 음식 종류는 상호 배타적
 * - 선호하는 맛/재료와 피하고 싶은 맛/재료는 상호 배타적
 */
export default function FoodPreferencePage({
  session,
  token,
  handleLogout,
  refreshSession,
}) {
  const navigate = useNavigate();
  const { groupId } = useParams(); // groupId가 URL에 있으면 그룹 컨텍스트, 없으면 온보딩

  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 선호도 state
  const [likedCategories, setLikedCategories] = useState([]);
  const [dislikedCategories, setDislikedCategories] = useState([]);
  const [dislikedKeywords, setDislikedKeywords] = useState([]);
  const [likedKeywords, setLikedKeywords] = useState([]);
  const [budgetRange, setBudgetRange] = useState([10000, 50000]);

  // 그룹 정보(선택적) 및 기존 선호도 로드
  useEffect(() => {
    if (token && session) {
      // 그룹 컨텍스트일 경우에만 그룹 정보 로드
      if (groupId) {
        const groupResult = getGroupById(token, groupId);
        if (groupResult.success) {
          setGroup(groupResult.group);
        } else {
          alert(groupResult.message);
          navigate(routes.home);
          return;
        }
      }

      // 기존 사용자 선호도가 있으면 불러오기
      if (session.user.preference) {
        const pref = session.user.preference;
        setLikedCategories(pref.likedCategories || []);
        setDislikedCategories(pref.dislikedCategories || []);
        setDislikedKeywords(pref.dislikedKeywords || []);
        setLikedKeywords(pref.likedKeywords || []);
        setBudgetRange(pref.budgetRange || [10000, 50000]);
      }
      setIsLoading(false);
    }
  }, [groupId, token, session, navigate]);

  // 좋아하는 카테고리 변경 핸들러 (선호하지 않는 카테고리에서 제거)
  const handleLikedCategoriesChange = (newLikedCategories) => {
    setLikedCategories(newLikedCategories);
    // 좋아하는 카테고리에 추가된 항목을 선호하지 않는 카테고리에서 제거
    setDislikedCategories((prev) =>
      prev.filter((cat) => !newLikedCategories.includes(cat))
    );
  };

  // 선호하지 않는 카테고리 변경 핸들러 (좋아하는 카테고리에서 제거)
  const handleDislikedCategoriesChange = (newDislikedCategories) => {
    setDislikedCategories(newDislikedCategories);
    // 선호하지 않는 카테고리에 추가된 항목을 좋아하는 카테고리에서 제거
    setLikedCategories((prev) =>
      prev.filter((cat) => !newDislikedCategories.includes(cat))
    );
  };

  // 선호하는 키워드 변경 핸들러 (피하고 싶은 키워드에서 제거)
  const handleLikedKeywordsChange = (newLikedKeywords) => {
    setLikedKeywords(newLikedKeywords);
    // 선호하는 키워드에 추가된 항목을 피하고 싶은 키워드에서 제거
    setDislikedKeywords((prev) =>
      prev.filter((kw) => !newLikedKeywords.includes(kw))
    );
  };

  // 피하고 싶은 키워드 변경 핸들러 (선호하는 키워드에서 제거)
  const handleDislikedKeywordsChange = (newDislikedKeywords) => {
    setDislikedKeywords(newDislikedKeywords);
    // 피하고 싶은 키워드에 추가된 항목을 선호하는 키워드에서 제거
    setLikedKeywords((prev) =>
      prev.filter((kw) => !newDislikedKeywords.includes(kw))
    );
  };

  // 선호도 저장
  const handleSavePreference = (e) => {
    e.preventDefault();

    const preference = {
      likedCategories,
      dislikedCategories,
      dislikedKeywords,
      likedKeywords,
      budgetRange,
      updatedAt: new Date().toISOString(),
    };

    const result = updateUser(token, { preference });

    if (result.success) {
      alert("선호도가 저장되었습니다!");

      // 세션 새로고침 (App.jsx의 상태 업데이트)
      if (refreshSession) {
        refreshSession();
      }

      if (groupId) {
        // 그룹 컨텍스트: 그룹 상세 페이지로 이동
        navigate(routes.groupDetail.replace(":groupId", groupId));
      } else {
        // 온보딩 컨텍스트: 메인 페이지로 이동
        navigate(routes.home);
      }
    } else {
      alert(`저장에 실패했습니다: ${result.message}`);
    }
  };

  const handleSkip = () => {
    navigate(routes.home);
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  // 그룹 컨텍스트가 아닐 경우(온보딩), group 객체가 없어도 페이지가 렌더링되어야 함.
  if (groupId && !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        그룹 정보 로딩 중...
      </div>
    );
  }

  const categories = Object.values(FOOD_CATEGORIES);
  const keywords = Object.values(FOOD_KEYWORDS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <HeaderBar session={session} handleLogout={handleLogout} />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-lg">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                음식 선호도 입력
              </h1>
              <p className="text-gray-600">
                {session.user.nickname}님의 음식 취향을 알려주세요.{" "}
                {groupId ? "" : "언제든지 수정할 수 있습니다."}
              </p>
              {group && (
                <p className="text-sm text-indigo-600 mt-1">
                  그룹: {group.name}
                </p>
              )}
            </div>

            <form onSubmit={handleSavePreference} className="space-y-8">
              {/* 좋아하는 음식 종류 */}
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
                  onChange={handleLikedCategoriesChange}
                  disabled={dislikedCategories} // 선호하지 않는 카테고리는 비활성화
                />
              </div>

              {/* 선호하지 않는 음식 종류 */}
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
                  onChange={handleDislikedCategoriesChange}
                  disabled={likedCategories} // 좋아하는 카테고리는 비활성화
                />
              </div>

              {/* 피하고 싶은 맛/재료 */}
              <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  피하고 싶은 맛/재료
                </h2>
                <CheckboxGroup
                  options={keywords}
                  selected={dislikedKeywords}
                  onChange={handleDislikedKeywordsChange}
                  disabled={likedKeywords} // 선호하는 키워드는 비활성화
                />
              </div>

              {/* 선호하는 맛/재료 */}
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  선호하는 맛/재료
                </h2>
                <CheckboxGroup
                  options={keywords}
                  selected={likedKeywords}
                  onChange={handleLikedKeywordsChange}
                  disabled={dislikedKeywords} // 피하고 싶은 키워드는 비활성화
                />
              </div>

              {/* 가격대 */}
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

              {/* 버튼 */}
              <div className="mt-8 flex gap-3">
                {groupId ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    onClick={() =>
                      navigate(routes.groupDetail.replace(":groupId", groupId))
                    }
                    className="flex-1"
                  >
                    취소
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    나중에 하기
                  </Button>
                )}
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
