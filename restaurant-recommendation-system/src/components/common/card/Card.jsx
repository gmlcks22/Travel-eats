import React from "react";
import { MapPin, Star, DollarSign } from "lucide-react";

// 가격 수준을 달러 기호로 렌더링하는 헬퍼 함수
const renderPriceLevel = (priceLevel) => {
  if (typeof priceLevel !== 'number' || priceLevel < 1) {
    return <span className="text-gray-400">가격 정보 없음</span>;
  }
  return (
    <span className="font-bold">
      <span className="text-green-600">
        {'$'.repeat(priceLevel)}
      </span>
      <span className="text-gray-300">
        {'$'.repeat(4 - priceLevel)}
      </span>
    </span>
  );
};

/**
 * 식당 카드 컴포넌트
 * @param {Object} restaurant - 식당 정보
 * @param {Object} consensus - 그룹 합의 정보 (선택사항)
 * @param {function} onClick - 클릭 이벤트 핸들러
 */
export function RestaurantCard({ restaurant, consensus, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-5 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* 식당 이미지 */}
      <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {restaurant.images && restaurant.images[0] ? (
          <img 
            src={restaurant.images[0]} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-indigo-300 text-4xl">🍽️</span>
        )}
      </div>

      {/* 식당 정보 */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-800">{restaurant.name}</h3>
          {consensus && (
            <div className="px-2 py-1 bg-indigo-100 rounded-lg">
              <span className="text-indigo-700 font-bold">{consensus.totalScore}점</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <span className="px-2 py-1 bg-indigo-50 rounded">{restaurant.category}</span>
          {restaurant.keywords?.map((keyword, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-gray-600">
              {keyword}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span>{restaurant.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {renderPriceLevel(restaurant.avgPrice)}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{restaurant.location?.address}</span>
        </div>

        {/* 그룹 합의 정보 */}
        {consensus && consensus.likedMembers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              👍 {consensus.likedMembers.map(m => m.nickname).join(", ")}님이 선호합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 그룹 카드 컴포넌트
 * @param {Object} group - 그룹 정보
 * @param {function} onClick - 클릭 이벤트 핸들러
 */
export function GroupCard({ group, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-5 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-indigo-800">{group.name}</h3>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono">
          {group.code}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>멤버 수: {group.members?.length || 0}명</p>
        <p>생성일: {new Date(group.createdAt).toLocaleDateString()}</p>
        {group.tripPlan?.days && (
          <p className="text-indigo-600 font-bold">
            📍 {group.tripPlan.days[0]?.description || '여행'} | {group.tripPlan.days.length}일 여행
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * 정보 카드 컴포넌트 (통계, 안내 등에 사용)
 */
export function InfoCard({ title, value, icon, color = "indigo" }) {
  const colorClasses = {
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300",
    green: "bg-green-100 text-green-700 border-green-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
  };

  return (
    <div className={`rounded-xl p-5 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );
}
