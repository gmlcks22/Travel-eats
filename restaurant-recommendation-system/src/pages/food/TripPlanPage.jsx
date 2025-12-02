import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  Circle,
  Autocomplete,
} from "@react-google-maps/api";
import HeaderBar from "@common/bar/HeaderBar";
import Button from "@common/button/Button";
import { Input } from "@components/common/Input";
import routes from "@utils/constants/routes";
import { getGroupById, updateGroup } from "@utils/helpers/storage";
import { Map, Pin, Milestone, Plus, Trash2, Search } from "lucide-react";

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "1rem",
  border: "2px solid #e5e7eb",
};

// 기본 지도 중심 (서울)
const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

const libraries = ["places", "marker"];

/**
 * 여행 계획 페이지 (지도 기반)
 */
export default function TripPlanPage({ session, token, handleLogout }) {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [numDays, setNumDays] = useState(1);
  const [tripDays, setTripDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  // useRef로 마커 관리 (상태가 아닌 참조로)
  const markerRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY || "",
    libraries,
  });

  // 그룹 정보 및 기존 계획 로드
  useEffect(() => {
    if (token) {
      const result = getGroupById(token, groupId);
      if (result.success) {
        setGroup(result.group);
        if (result.group.tripPlan?.days) {
          const existingDays = result.group.tripPlan.days;
          setNumDays(existingDays.length);
          setTripDays(existingDays);
        } else {
          // 새 계획 초기화
          setTripDays([
            { day: 1, location: null, radius: 1000, description: "" },
          ]);
        }
      } else {
        alert(result.message);
        navigate(routes.home);
      }
    }
  }, [groupId, token, navigate]);

  // 마커 업데이트 (AdvancedMarkerElement 사용) - 수정된 버전
  useEffect(() => {
    if (map && isLoaded && window.google?.maps?.marker?.AdvancedMarkerElement) {
      const currentDay = tripDays[activeDayIndex];

      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }

      // 새 마커 생성
      if (currentDay?.location) {
        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: currentDay.location,
          title: `${activeDayIndex + 1}일차`,
        });
        markerRef.current = newMarker;

        // 지도 중심을 마커 위치로 이동 (부드럽게)
        map.panTo(currentDay.location);
      }
    }
  }, [map, isLoaded, activeDayIndex, tripDays]);

  // 날짜 수 변경 시
  const handleNumDaysChange = (newNumDays) => {
    const num = Math.max(1, parseInt(newNumDays, 10) || 1);
    setNumDays(num);

    const newTripDays = Array.from({ length: num }, (_, i) => {
      return (
        tripDays[i] || {
          day: i + 1,
          location: null,
          radius: 1000,
          description: "",
        }
      );
    });
    setTripDays(newTripDays);
    if (activeDayIndex >= num) {
      setActiveDayIndex(num - 1);
    }
  };

  // Autocomplete 로드 완료 시
  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  // 장소 선택 시
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // 현재 활성 날짜의 위치 업데이트
        const newTripDays = [...tripDays];
        newTripDays[activeDayIndex] = {
          ...newTripDays[activeDayIndex],
          location: newLocation,
        };

        // 장소 이름을 description에 자동 입력 (사용자가 수정 가능)
        if (!newTripDays[activeDayIndex].description) {
          newTripDays[activeDayIndex].description =
            place.formatted_address || place.name || "";
        }

        setTripDays(newTripDays);

        // 지도 중심 이동 및 줌
        if (map) {
          map.panTo(newLocation);
          map.setZoom(13);
        }

        // 검색창 초기화
        setSearchValue("");
      }
    }
  };

  // 지도 클릭 시
  const onMapClick = (e) => {
    const newLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex] = {
      ...newTripDays[activeDayIndex],
      location: newLocation,
    };
    setTripDays(newTripDays);
  };

  // 반경 변경 시
  const handleRadiusChange = (newRadius) => {
    const radius = Math.max(100, parseInt(newRadius, 10));
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex] = {
      ...newTripDays[activeDayIndex],
      radius: radius,
    };
    setTripDays(newTripDays);
  };

  // 설명 변경 시
  const handleDescriptionChange = (newDescription) => {
    const newTripDays = [...tripDays];
    newTripDays[activeDayIndex] = {
      ...newTripDays[activeDayIndex],
      description: newDescription,
    };
    setTripDays(newTripDays);
  };

  // 저장
  const handleSave = () => {
    const hasInvalidDay = tripDays.some(
      (day) => !day.location || !day.description.trim()
    );
    if (hasInvalidDay) {
      alert("모든 날짜의 위치와 설명을 입력해주세요.");
      return;
    }

    console.log("💾 여행 계획 저장 중...");
    console.log("💾 기존 restaurantsByDay 삭제");
    console.log("💾 기존 restaurants 삭제");

    // 여행 계획 저장 시 기존 식당 추천 데이터 초기화
    const tripPlan = { days: tripDays };
    const result = updateGroup(token, groupId, {
      tripPlan,
      restaurantsByDay: null,
      restaurants: null,
      lastRecommendation: null,
    });

    if (result.success) {
      // localStorage에 저장된 선택된 식당도 초기화
      const selectedRestaurantsKey = `selectedRestaurants_${groupId}`;
      localStorage.removeItem(selectedRestaurantsKey);
      console.log("💾 localStorage 선택 데이터 삭제:", selectedRestaurantsKey);

      alert("여행 계획이 저장되었습니다.\n식당 추천을 다시 받아주세요.");
      navigate(routes.groupDetail.replace(":groupId", groupId));
    } else {
      alert(`저장 실패: ${result.message}`);
    }
  };

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, []);

  const currentDay = tripDays[activeDayIndex];

  if (!group || !session) return <div>로딩 중...</div>;

  // API 키 에러 처리
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
        <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
          <HeaderBar session={session} handleLogout={handleLogout} />
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                Google Maps API 키가 설정되지 않았습니다
              </h2>
              <p className="text-red-700 mb-4">
                프로젝트 루트에{" "}
                <code className="bg-red-100 px-2 py-1 rounded">.env.local</code>{" "}
                파일을 생성하고 다음 내용을 추가해주세요:
              </p>
              <pre className="bg-red-100 p-4 rounded-lg text-left text-sm mb-4">
                VITE_GOOGLE_PLACES_API_KEY=your_api_key_here
              </pre>
              <p className="text-sm text-red-600">
                API 키는{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>
                에서 발급받을 수 있습니다.
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(routes.groupDetail.replace(":groupId", groupId))
                }
                className="mt-6"
              >
                그룹으로 돌아가기
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 p-2 bg-white/80 backdrop-blur-3xl rounded-none shadow-sm">
        <HeaderBar session={session} handleLogout={handleLogout} />
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">여행 계획 설정</h1>
            <p className="text-gray-600 mt-2">
              지도를 클릭하여 각 날짜의 여행지를 설정하세요.
            </p>
          </div>

          {/* 여행 기간 설정 */}
          <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-md border-2 border-indigo-200">
            <label className="font-bold text-lg">여행 기간:</label>
            <Input
              type="number"
              value={numDays}
              onChange={(val) => handleNumDaysChange(val)}
              className="w-24"
              min="1"
            />
            <span className="text-lg">일</span>
          </div>

          {/* 날짜 선택 탭 */}
          <div className="flex space-x-2 border-b-2 border-gray-200 mb-6">
            {tripDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setActiveDayIndex(index)}
                className={`px-4 py-3 font-bold transition-colors ${
                  activeDayIndex === index
                    ? "border-b-4 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-indigo-500"
                }`}
              >
                {index + 1}일차
              </button>
            ))}
          </div>

          {/* 지도 및 설정 (현재 활성화된 날짜 기준) */}
          {currentDay && (
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-200 space-y-6">
              <h2 className="text-xl font-bold text-indigo-700">
                {activeDayIndex + 1}일차 계획
              </h2>
              {loadError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700">
                    지도 로딩 오류: {loadError.message}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    API 키를 확인해주세요.
                  </p>
                </div>
              )}
              {!isLoaded ? (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-600">지도 로딩 중...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 도시 검색창 */}
                  <div className="relative">
                    <Autocomplete
                      onLoad={onLoadAutocomplete}
                      onPlaceChanged={onPlaceChanged}
                      options={{
                        types: ["(cities)"],
                        fields: ["geometry", "formatted_address", "name"],
                      }}
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="도시명을 검색하세요 (예: 서울, 부산, 제주)"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none text-base"
                        />
                      </div>
                    </Autocomplete>
                    <p className="text-sm text-gray-500 mt-2">
                      💡 도시명을 검색하거나 지도를 직접 클릭하여 위치를
                      설정하세요
                    </p>
                  </div>

                  {/* 지도 */}
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={currentDay.location || defaultCenter}
                    zoom={13}
                    onClick={onMapClick}
                    onLoad={(map) => setMap(map)}
                    options={{
                      mapId: "DEMO_MAP_ID",
                    }}
                  >
                    {currentDay.location && (
                      <Circle
                        center={currentDay.location}
                        radius={currentDay.radius}
                        options={{
                          strokeColor: "#818cf8",
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          fillColor: "#c7d2fe",
                          fillOpacity: 0.35,
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="font-bold text-gray-700 block mb-2">
                    위치 설명
                  </label>
                  <Input
                    value={currentDay.description}
                    onChange={handleDescriptionChange}
                    placeholder="예: 서울숲 근처, 강남역 11번 출구"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    지도에서 선택한 위치를 설명해주세요.
                  </p>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-2">
                    검색 반경: {currentDay.radius}m
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={currentDay.radius}
                    onChange={(e) => handleRadiusChange(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="mt-8 flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() =>
                navigate(routes.groupDetail.replace(":groupId", groupId))
              }
            >
              취소
            </Button>
            <Button variant="primary" size="lg" onClick={handleSave}>
              여행 계획 저장
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
