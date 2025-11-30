import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { RestaurantCard, InfoCard } from "@components/common/card/Card";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import { Trophy, Filter, MapPin, Star, TrendingUp } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const adaptPlaceToRestaurant = (place) => {
  let photoUrl = "https://via.placeholder.com/400x300?text=No+Image";
  // API 키가 설정되었고, 사진 정보가 있을 경우에만 실제 이미지 URL 생성
  if (API_KEY && API_KEY !== "YOUR_API_KEY" && place.photos && place.photos.length > 0) {
    const photoReference = place.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${API_KEY}`;
  }

  return {
    id: place.place_id, // Card에서 id를 사용하므로 place_id를 id로 매핑
    place_id: place.place_id,
    name: place.name,
    images: [photoUrl],
    category: place.types ? place.types[0] : "음식점",
    keywords: place.types, // keywords 대신 types 배열을 전달
    rating: place.rating || 0,
    avgPrice: place.price_level, // 0~4 정수, 실제 가격이 아님
    location: {
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
  };
};


/**
 * 추천 결과 페이지
 */
export default function FoodResultPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [filterRating, setFilterRating] = useState(0);

  // 그룹 및 추천 결과 로드
  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        const groupData = result.group;

        if (!groupData.restaurants || groupData.restaurants.length === 0) {
          alert("아직 추천 결과가 없습니다. 선호도를 먼저 입력해주세요.");
          navigate(routes.groupDetail.replace(":groupId", groupId));
          return;
        }

        const adaptedRestaurants = groupData.restaurants.map(adaptPlaceToRestaurant);
        setGroup(groupData);
        setRestaurants(adaptedRestaurants);
        setFilteredRestaurants(adaptedRestaurants);
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate]);

  // 필터링 처리
  useEffect(() => {
    if (filterRating === 0) {
      setFilteredRestaurants(restaurants);
    } else {
      setFilteredRestaurants(
        restaurants.filter(r => r.rating >= filterRating)
      );
    }
  }, [filterRating, restaurants]);

  // 식당 상세 페이지로 이동
  const handleRestaurantClick = (restaurant) => {
    // Google Places API 데이터는 복잡하므로 state로 전달하는 것이 유용
    navigate(
      routes.foodDetail
        .replace(":groupId", groupId)
        .replace(":restaurantId", restaurant.id),
      { state: { restaurant } }
    );
  };

  if (!group || !session) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  const topRestaurant = filteredRestaurants.length > 0
    ? filteredRestaurants.reduce((prev, current) => (prev.rating > current.rating) ? prev : current)
    : null;
  
  const avgRating = filteredRestaurants.length > 0
    ? (
        filteredRestaurants.reduce((sum, r) => sum + (r.rating || 0), 0) /
        filteredRestaurants.filter(r => r.rating > 0).length
      ).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎉 추천 식당 결과
          </h1>
          <p className="text-gray-600">
            {group.name} · {group.tripPlan?.days?.[0]?.description || '여행'} · {group.tripPlan?.days?.length || 0}일 여행
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            title="추천 식당"
            value={`${filteredRestaurants.length}개`}
            icon={<MapPin />}
            color="indigo"
          />
          <InfoCard
            title="평균 별점"
            value={avgRating > 0 ? `${avgRating}점` : "-"}
            icon={<Star />}
            color="green"
          />
          <InfoCard
            title="최고 별점"
            value={topRestaurant ? `${topRestaurant.rating}점` : "-"}
            icon={<Trophy />}
            color="purple"
          />
          <InfoCard
            title="그룹 멤버"
            value={`${group.members.length}명`}
            icon={<TrendingUp />}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">필터</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    최소 별점
                  </label>
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={0}>전체 보기</option>
                    <option value={4.5}>4.5점 이상</option>
                    <option value={4.0}>4.0점 이상</option>
                    <option value={3.5}>3.5점 이상</option>
                    <option value={3.0}>3.0점 이상</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    현재 {filteredRestaurants.length}개의 식당이 표시되고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {filteredRestaurants.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border-2 border-yellow-200 text-center">
                <p className="text-xl text-gray-600">
                  해당 조건의 식당이 없습니다.
                  <br />
                  필터를 조정해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRestaurants.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    // consensus prop은 더 이상 전달하지 않음
                    onClick={() => handleRestaurantClick(restaurant)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(routes.groupDetail.replace(":groupId", groupId))}
          >
            그룹으로 돌아가기
          </Button>
        </div>
      </main>
    </div>
  );
}