import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import routes from "@utils/constants/routes";
import { getGroupById } from "@utils/helpers/storage";
import {
  Calendar,
  Star,
  MapPin,
  Check,
  Filter,
  ChevronRight,
  Sunrise,
  Sun,
  Sunset,
  ExternalLink,
  Navigation,
  DollarSign,
  Map,
  X,
} from "lucide-react";

// Google Place를 우리 Restaurant 형식으로 변환
const adaptPlaceToRestaurant = (place) => {
  const getPriceLabel = (priceLevel) => {
    const labels = {
      0: "무료",
      1: "저렴 (~10,000원)",
      2: "보통 (10,000~30,000원)",
      3: "비싼 (30,000~60,000원)",
      4: "고급 (60,000원+)",
    };
    return priceLevel !== null && priceLevel !== undefined
      ? labels[priceLevel]
      : "가격 정보 없음";
  };

  return {
    id: place.place_id,
    name: place.name,
    category: place.types?.[0] || "restaurant",
    rating: place.rating || 0,
    user_ratings_total: place.user_ratings_total || 0,
    priceLevel: place.price_level ?? null,
    priceLabel: getPriceLabel(place.price_level),
    location: {
      address: place.vicinity || place.formatted_address || "",
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
    },
    images:
      place.photos?.map(
        (photo) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
            photo.photo_reference
          }&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`
      ) || [],
  };
};

// 끼니 옵션
const MEAL_TYPES = [
  {
    id: "breakfast",
    label: "아침",
    icon: Sunrise,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-600",
    bgLight: "bg-orange-50",
  },
  {
    id: "lunch",
    label: "점심",
    icon: Sun,
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-600",
    bgLight: "bg-yellow-50",
  },
  {
    id: "dinner",
    label: "저녁",
    icon: Sunset,
    color: "bg-indigo-500",
    textColor: "text-indigo-600",
    borderColor: "border-indigo-600",
    bgLight: "bg-indigo-50",
  },
];

/**
 * 식당 선택 페이지 - 끼니별 선택
 */
export default function FoodResultPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [restaurantsByDay, setRestaurantsByDay] = useState({});
  const [selectedRestaurants, setSelectedRestaurants] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeMealType, setActiveMealType] = useState("breakfast");
  const [filterRating, setFilterRating] = useState(0);
  const [filterPrice, setFilterPrice] = useState(0);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // 지도 관련 ref
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const isGoogleMapsLoadedRef = useRef(false);

  const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;

  const currentDayRestaurants = restaurantsByDay[activeDayIndex] || [];

  // Google Maps API 동적 로드 함수
  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      if (isGoogleMapsLoadedRef.current) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      isGoogleMapsLoadedRef.current = true;

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_PLACES_API_KEY
      }&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log("✅ Google Maps API 로드 완료");
        resolve();
      };

      script.onerror = () => {
        console.error("❌ Google Maps API 로드 실패");
        isGoogleMapsLoadedRef.current = false;
        reject(new Error("Google Maps API 로드 실패"));
      };

      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (!result.success) {
        alert(result.message);
        navigate(routes.home);
        return;
      }

      const groupData = result.group;

      let restaurantsData = {};

      if (
        groupData.restaurantsByDay &&
        Object.keys(groupData.restaurantsByDay).length > 0
      ) {
        restaurantsData = groupData.restaurantsByDay;
      } else if (groupData.restaurants && groupData.restaurants.length > 0) {
        restaurantsData = { 0: groupData.restaurants };
      }

      if (Object.keys(restaurantsData).length === 0) {
        alert("아직 추천 결과가 없습니다. 식당 추천을 먼저 받아주세요.");
        navigate(routes.groupDetail.replace(":groupId", groupId));
        return;
      }

      const adaptedRestaurantsByDay = {};
      for (const dayIdx in restaurantsData) {
        const dayRestaurants = restaurantsData[dayIdx];
        if (Array.isArray(dayRestaurants) && dayRestaurants.length > 0) {
          adaptedRestaurantsByDay[dayIdx] = dayRestaurants.map(
            adaptPlaceToRestaurant
          );
        }
      }

      setGroup(groupData);
      setRestaurantsByDay(adaptedRestaurantsByDay);

      const saved = localStorage.getItem(selectedRestaurantsKey);
      if (saved) {
        setSelectedRestaurants(JSON.parse(saved));
      }
    }
  }, [groupId, token, navigate, selectedRestaurantsKey]);

  // 지도 초기화 useEffect
  useEffect(() => {
    if (isMapModalOpen && mapRef.current && currentDayRestaurants.length > 0) {
      loadGoogleMapsScript()
        .then(() => {
          if (!window.google || !window.google.maps) {
            console.error("Google Maps API가 로드되지 않았습니다.");
            alert("Google Maps를 로드할 수 없습니다. API 키를 확인해주세요.");
            return;
          }

          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 13,
            center: {
              lat: currentDayRestaurants[0]?.location?.lat || 37.5665,
              lng: currentDayRestaurants[0]?.location?.lng || 126.978,
            },
          });

          mapInstanceRef.current = map;

          markersRef.current.forEach((marker) => marker.setMap(null));
          infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
          markersRef.current = [];
          infoWindowsRef.current = [];

          const bounds = new window.google.maps.LatLngBounds();

          currentDayRestaurants.forEach((restaurant, idx) => {
            if (restaurant.location?.lat && restaurant.location?.lng) {
              const position = {
                lat: restaurant.location.lat,
                lng: restaurant.location.lng,
              };

              const marker = new window.google.maps.Marker({
                position,
                map,
                label: {
                  text: `${idx + 1}`,
                  color: "white",
                  fontWeight: "bold",
                },
                title: restaurant.name,
              });

              markersRef.current.push(marker);

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h3 style="font-weight: bold; margin-bottom: 4px;">${
                      restaurant.name
                    }</h3>
                    <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                      <span>⭐ ${restaurant.rating || "N/A"}</span>
                      ${
                        restaurant.priceLevel
                          ? `<span style="color: #10b981; font-weight: bold;">• ${"$".repeat(
                              restaurant.priceLevel
                            )}</span>`
                          : ""
                      }
                    </div>
                    <p style="font-size: 12px; color: #666;">${
                      restaurant.location.address
                    }</p>
                  </div>
                `,
              });

              infoWindowsRef.current.push(infoWindow);

              marker.addListener("click", () => {
                infoWindowsRef.current.forEach((iw) => iw.close());
                infoWindow.open(map, marker);
              });

              bounds.extend(position);
            }
          });

          if (currentDayRestaurants.length > 1) {
            map.fitBounds(bounds);
          }

          console.log(
            `✅ 총 ${markersRef.current.length}개의 마커가 추가되었습니다.`
          );
        })
        .catch((error) => {
          console.error("Google Maps API 로드 오류:", error);
          alert(
            "Google Maps를 로드할 수 없습니다. 인터넷 연결을 확인하거나 API 키를 확인해주세요."
          );
        });
    }
  }, [isMapModalOpen, currentDayRestaurants]);

  const handleSelectRestaurant = (dayIdx, mealType, restaurant) => {
    const key = `${dayIdx}_${mealType}`;

    setSelectedRestaurants((prev) => {
      const newSelected = { ...prev };
      const currentMealSelections = [...(newSelected[key] || [])];
      const existingIndex = currentMealSelections.findIndex(
        (r) => r.id === restaurant.id
      );

      if (existingIndex >= 0) {
        const updatedSelections = currentMealSelections.filter(
          (_, idx) => idx !== existingIndex
        );

        if (updatedSelections.length === 0) {
          delete newSelected[key];
        } else {
          newSelected[key] = updatedSelections;
        }
      } else {
        if (currentMealSelections.length < 5) {
          const updatedSelections = [...currentMealSelections, restaurant];
          newSelected[key] = updatedSelections;
        } else {
          alert("끼니당 최대 5개까지만 선택할 수 있습니다.");
          return prev;
        }
      }

      localStorage.setItem(selectedRestaurantsKey, JSON.stringify(newSelected));

      return newSelected;
    });
  };

  const handleComplete = () => {
    if (Object.keys(selectedRestaurants).length === 0) {
      alert("최소 하나의 식당을 선택해주세요.");
      return;
    }

    navigate(routes.finalPlan.replace(":groupId", groupId));
  };

  // 지도에서 식당 클릭 핸들러
  const handleRestaurantClickOnMap = (restaurantIndex) => {
    if (mapInstanceRef.current && markersRef.current[restaurantIndex]) {
      const marker = markersRef.current[restaurantIndex];
      const restaurant = currentDayRestaurants[restaurantIndex];

      mapInstanceRef.current.panTo(marker.getPosition());
      mapInstanceRef.current.setZoom(16);

      infoWindowsRef.current.forEach((iw) => iw.close());

      // 상세한 식당 카드를 정보창으로 생성
      const detailedInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
            ${
              restaurant.images[0]
                ? `
              <img 
                src="${restaurant.images[0]}" 
                alt="${restaurant.name}"
                style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
              />
            `
                : `
              <div style="width: 100%; height: 150px; background: #e5e7eb; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #9ca3af;">이미지 없음</span>
              </div>
            `
            }
            
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1f2937;">${
              restaurant.name
            }</h3>
            
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>⭐</span>
                <span style="font-weight: bold; color: #1f2937;">${
                  restaurant.rating || "N/A"
                }</span>
                ${
                  restaurant.user_ratings_total
                    ? `
                  <span style="font-size: 12px; color: #6b7280;">(${restaurant.user_ratings_total})</span>
                `
                    : ""
                }
              </div>
              ${
                restaurant.priceLevel
                  ? `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="color: #10b981; font-weight: bold; font-size: 14px;">${"$".repeat(
                    restaurant.priceLevel
                  )}</span>
                </div>
              `
                  : ""
              }
            </div>
            
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; display: flex; align-items: start; gap: 4px;">
              <span>📍</span>
              <span>${restaurant.location.address}</span>
            </p>
            
            <div style="display: grid; gap: 8px;">
              <a 
                href="${window.location.origin}/group/${groupId}/food/${
          restaurant.id
        }"
                style="display: block; text-align: center; padding: 8px 12px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; transition: background 0.2s;"
                onmouseover="this.style.background='#e5e7eb'"
                onmouseout="this.style.background='#f3f4f6'"
              >
                상세보기
              </a>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <a 
                  href="https://www.google.com/maps/place/?q=place_id:${
                    restaurant.id
                  }" 
                  target="_blank"
                  style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 12px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background 0.2s;"
                  onmouseover="this.style.background='#4338ca'"
                  onmouseout="this.style.background='#4f46e5'"
                >
                  
                  <span>지도</span>
                </a>
                
                ${
                  restaurant.location?.lat && restaurant.location?.lng
                    ? `
                  <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}" 
                    target="_blank"
                    style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 8px 12px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 500; transition: background 0.2s;"
                    onmouseover="this.style.background='#e5e7eb'"
                    onmouseout="this.style.background='#f3f4f6'"
                  >
                    
                    <span>길찾기</span>
                  </a>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        `,
      });

      detailedInfoWindow.open(mapInstanceRef.current, marker);
      infoWindowsRef.current[restaurantIndex] = detailedInfoWindow;
    }
  };

  if (!group || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중...
      </div>
    );
  }

  let filteredRestaurants = currentDayRestaurants;

  if (filterRating > 0) {
    filteredRestaurants = filteredRestaurants.filter(
      (r) => r.rating >= filterRating
    );
  }

  if (filterPrice > 0) {
    filteredRestaurants = filteredRestaurants.filter(
      (r) => r.priceLevel === filterPrice
    );
  }

  const currentMealKey = `${activeDayIndex}_${activeMealType}`;
  const currentMealSelections = selectedRestaurants[currentMealKey] || [];

  const totalDays = Object.keys(restaurantsByDay).length;

  const selectedDaysSet = new Set();
  Object.keys(selectedRestaurants).forEach((key) => {
    const dayIndex = key.split("_")[0];
    const restaurants = selectedRestaurants[key];
    if (Array.isArray(restaurants) && restaurants.length > 0) {
      selectedDaysSet.add(dayIndex);
    }
  });
  const selectedDaysCount = selectedDaysSet.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <header className="p-5 bg-indigo-100 border-b-3 border-indigo-300 rounded-b-2xl shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              식당 선택하기
            </h1>
            <p className="text-gray-600">
              각 끼니별로 최대 5개까지 선택할 수 있습니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setIsMapModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Map className="w-5 h-5" />
              지도에서 보기
            </Button>
            <Button variant="primary" size="lg" onClick={handleComplete}>
              선택 완료 ({selectedDaysCount}/{totalDays}일)
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* 일차별 탭 */}
        <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-lg mb-6">
          <div className="flex space-x-2 border-b-2 border-gray-200 pb-2 mb-4 overflow-x-auto">
            {Object.keys(restaurantsByDay)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((dayIdx) => {
                const idx = parseInt(dayIdx);
                const dayLabel = idx + 1;

                const breakfastCount = (
                  selectedRestaurants[`${idx}_breakfast`] || []
                ).length;
                const lunchCount = (selectedRestaurants[`${idx}_lunch`] || [])
                  .length;
                const dinnerCount = (selectedRestaurants[`${idx}_dinner`] || [])
                  .length;
                const totalSelected = breakfastCount + lunchCount + dinnerCount;
                const hasSelection = totalSelected > 0;

                return (
                  <button
                    key={dayIdx}
                    onClick={() => {
                      setActiveDayIndex(idx);
                      setActiveMealType("breakfast");
                    }}
                    className={`px-6 py-3 font-bold transition-all whitespace-nowrap flex items-center gap-2 rounded-lg ${
                      activeDayIndex === idx
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    {dayLabel}일차
                    {hasSelection && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          activeDayIndex === idx
                            ? "bg-white/20"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {totalSelected}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* 끼니 선택 탭 */}
          <div className="flex gap-2">
            {MEAL_TYPES.map((meal) => {
              const MealIcon = meal.icon;
              const mealKey = `${activeDayIndex}_${meal.id}`;
              const mealSelections = selectedRestaurants[mealKey] || [];
              const isActive = activeMealType === meal.id;

              return (
                <button
                  key={meal.id}
                  onClick={() => setActiveMealType(meal.id)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    meal.id === "breakfast"
                      ? isActive
                        ? "border-orange-600 bg-orange-600 shadow-lg"
                        : "border-orange-300 bg-orange-100"
                      : meal.id === "lunch"
                      ? isActive
                        ? "border-yellow-600 bg-yellow-600 shadow-lg"
                        : "border-yellow-300 bg-yellow-100"
                      : isActive
                      ? "border-indigo-600 bg-indigo-600 shadow-lg"
                      : "border-indigo-300 bg-indigo-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MealIcon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-white"
                          : meal.id === "breakfast"
                          ? "text-orange-600"
                          : meal.id === "lunch"
                          ? "text-yellow-600"
                          : "text-indigo-600"
                      }`}
                    />
                    <span
                      className={`font-bold ${
                        isActive
                          ? "text-white"
                          : meal.id === "breakfast"
                          ? "text-orange-600"
                          : meal.id === "lunch"
                          ? "text-yellow-600"
                          : "text-indigo-600"
                      }`}
                    >
                      {meal.label}
                    </span>
                    {mealSelections.length > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-white/30 text-white"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {mealSelections.length}/5
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 현재 날짜 정보 */}
        {group.tripPlan?.days?.[activeDayIndex] && (
          <div className="bg-indigo-50 rounded-lg p-4 mb-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-800">
                {group.tripPlan.days[activeDayIndex].description}
              </span>
              <span className="text-gray-600">
                - {MEAL_TYPES.find((m) => m.id === activeMealType)?.label} 식당
                선택 중
              </span>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-xl p-4 mb-6 border-2 border-indigo-200 shadow-lg">
          <div className="space-y-4">
            {/* 별점 필터 */}
            <div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-gray-800 text-sm">
                  최소 별점:
                </span>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                        filterRating === rating
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600 font-bold"
                          : "border-gray-300 text-gray-700 hover:border-indigo-400"
                      }`}
                    >
                      {rating === 0 ? "전체" : `⭐ ${rating}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 가격대 필터 */}
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">
                  가격대:
                </span>
                <div className="flex gap-2">
                  {[
                    { value: 0, label: "전체" },
                    { value: 1, label: "$" },
                    { value: 2, label: "$$" },
                    { value: 3, label: "$$$" },
                    { value: 4, label: "$$$$" },
                  ].map((price) => (
                    <button
                      key={price.value}
                      onClick={() => setFilterPrice(price.value)}
                      className={`px-3 py-1.5 rounded-lg border-2 transition-all text-sm font-bold ${
                        filterPrice === price.value
                          ? price.value === 0
                            ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                            : price.value === 1
                            ? "border-green-600 bg-green-50 text-green-600"
                            : price.value === 2
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : price.value === 3
                            ? "border-orange-600 bg-orange-50 text-orange-600"
                            : "border-purple-600 bg-purple-50 text-purple-600"
                          : "border-gray-300 text-gray-700 hover:border-indigo-400"
                      }`}
                    >
                      {price.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 식당 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant, index) => {
            const isSelectedInCurrentMeal = currentMealSelections.some(
              (r) => r.id === restaurant.id
            );

            const breakfastKey = `${activeDayIndex}_breakfast`;
            const lunchKey = `${activeDayIndex}_lunch`;
            const dinnerKey = `${activeDayIndex}_dinner`;

            const isInBreakfast = (
              selectedRestaurants[breakfastKey] || []
            ).some((r) => r.id === restaurant.id);
            const isInLunch = (selectedRestaurants[lunchKey] || []).some(
              (r) => r.id === restaurant.id
            );
            const isInDinner = (selectedRestaurants[dinnerKey] || []).some(
              (r) => r.id === restaurant.id
            );

            return (
              <div
                key={restaurant.id}
                className={`bg-white rounded-2xl overflow-hidden border-2 shadow-lg transition-all ${
                  isSelectedInCurrentMeal
                    ? "border-green-500 ring-4 ring-green-200"
                    : "border-gray-200 hover:border-indigo-400 hover:shadow-xl"
                }`}
              >
                {/* 이미지 */}
                <div
                  className="relative h-48 cursor-pointer overflow-hidden"
                  onClick={() =>
                    handleSelectRestaurant(
                      activeDayIndex,
                      activeMealType,
                      restaurant
                    )
                  }
                >
                  {restaurant.images[0] ? (
                    <>
                      <img
                        src={restaurant.images[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* 끼니별 선택 체크 */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {isInBreakfast && (
                      <div className="bg-orange-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {isInLunch && (
                      <div className="bg-yellow-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    {isInDinner && (
                      <div className="bg-indigo-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* 끼니 표시 */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isInBreakfast && (
                      <span className="text-xs font-bold bg-orange-500 text-white px-2 py-1 rounded shadow-lg">
                        아침
                      </span>
                    )}
                    {isInLunch && (
                      <span className="text-xs font-bold bg-yellow-500 text-white px-2 py-1 rounded shadow-lg">
                        점심
                      </span>
                    )}
                    {isInDinner && (
                      <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-1 rounded shadow-lg">
                        저녁
                      </span>
                    )}
                  </div>
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 truncate mb-2">
                    {restaurant.name}
                  </h3>

                  {/* 별점 & 가격 정보 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-800">
                        {restaurant.rating || "N/A"}
                      </span>
                      {restaurant.user_ratings_total && (
                        <span className="text-xs text-gray-500">
                          ({restaurant.user_ratings_total})
                        </span>
                      )}
                    </div>
                    {restaurant.priceLevel !== null &&
                      restaurant.priceLevel !== undefined && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600 text-sm">
                              {"$".repeat(restaurant.priceLevel)}
                            </span>
                          </div>
                        </>
                      )}
                  </div>

                  <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {restaurant.location.address}
                    </span>
                  </p>

                  {/* 버튼들 */}
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          routes.foodDetail
                            .replace(":groupId", groupId)
                            .replace(":restaurantId", restaurant.id)
                        );
                      }}
                      className="w-full"
                    >
                      상세보기
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/maps/place/?q=place_id:${restaurant.id}`,
                            "_blank"
                          );
                        }}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        지도
                      </Button>

                      {restaurant.location?.lat && restaurant.location?.lng && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`,
                              "_blank"
                            );
                          }}
                          className="text-xs"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          길찾기
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            해당 조건의 식당이 없습니다.
          </div>
        )}
      </main>

      {/* 지도 모달 */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Map className="w-6 h-6 text-indigo-600" />
                  추천 식당 위치
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeDayIndex + 1}일차 - {currentDayRestaurants.length}개
                  식당
                </p>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* 지도 컨테이너 */}
            <div className="flex-1 relative">
              <div
                ref={mapRef}
                id="restaurants-map"
                className="w-full h-full"
              />
            </div>

            {/* 식당 목록 (사이드바) */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {currentDayRestaurants.map((restaurant, idx) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleRestaurantClickOnMap(idx)}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {restaurant.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-600">
                            {restaurant.rating || "N/A"}
                          </span>
                          {restaurant.priceLevel && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-green-600 font-bold">
                                {"$".repeat(restaurant.priceLevel)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
