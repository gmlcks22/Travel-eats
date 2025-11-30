/**
 * Google Places API 연동을 위한 유틸리티
 * 
 * @see https://developers.google.com/maps/documentation/places/web-service/overview
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// 프록시를 사용할 로컬 경로로 변경
const PLACES_API_ENDPOINT = "/maps/api/place/textsearch/json";

/**
 * Google Places API를 사용하여 장소를 검색합니다.
 * 
 * @param {string} query - 검색어 (예: "서울 강남역 맛집", "제주도 흑돼지")
 * @returns {Promise<{success: boolean, places: Array, message: string}>}
 */
export const searchPlaces = async (query) => {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("Google Places API 키가 설정되지 않았습니다. `.env.local` 파일을 생성하고 `VITE_GOOGLE_PLACES_API_KEY`를 설정해주세요.");
    // 개발 편의를 위해 모의(mock) 데이터를 반환합니다.
    return Promise.resolve({
      success: true,
      places: [
        { 
          place_id: "mock_1", 
          name: "모의 식당 1 (API 키 필요)", 
          formatted_address: "서울시 강남구 테헤란로", 
          rating: 4.5, 
          user_ratings_total: 150,
          types: ["restaurant", "food", "point_of_interest"],
          geometry: { location: { lat: 37.50, lng: 127.05 } },
          photos: [{ photo_reference: "mock_photo_ref_1" }]
        },
        { 
          place_id: "mock_2", 
          name: "모의 식당 2 (API 키 필요)", 
          formatted_address: "서울시 서초구 강남대로", 
          rating: 4.2, 
          user_ratings_total: 80,
          types: ["cafe", "food", "point_of_interest"],
          geometry: { location: { lat: 37.49, lng: 127.03 } },
          photos: [{ photo_reference: "mock_photo_ref_2" }]
        },
      ],
      message: "API 키가 없어 모의 데이터를 반환합니다."
    });
  }

  const url = `${PLACES_API_ENDPOINT}?query=${encodeURIComponent(query)}&key=${API_KEY}&language=ko`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      return {
        success: true,
        places: data.results,
        message: "장소 검색에 성공했습니다."
      };
    } else {
      return {
        success: false,
        places: [],
        message: `API 오류: ${data.status} - ${data.error_message || "알 수 없는 오류"}`
      };
    }
  } catch (error) {
    console.error("Google Places API 호출 중 네트워크 오류 발생:", error);
    return {
      success: false,
      places: [],
      message: "네트워크 오류로 인해 장소를 검색할 수 없습니다."
    };
  }
};
