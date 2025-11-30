import React from "react";

/**
 * 텍스트 입력 컴포넌트
 * @param {string} label - 라벨 텍스트
 * @param {string} type - 입력 타입 (text, password, email 등)
 * @param {string} value - 입력 값
 * @param {function} onChange - 값 변경 핸들러
 * @param {string} placeholder - 플레이스홀더
 */
export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  className = "",
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
      />
    </div>
  );
}

/**
 * 체크박스 그룹 컴포넌트 (다중 선택)
 * @param {string} label - 그룹 라벨
 * @param {Array} options - 선택 옵션 배열
 * @param {Array} selected - 선택된 값 배열
 * @param {function} onChange - 선택 변경 핸들러
 * @param {Array} disabled - 비활성화할 옵션 배열
 */
export function CheckboxGroup({
  label,
  options,
  selected = [],
  onChange,
  disabled = [],
}) {
  // 체크박스 토글 처리
  const handleToggle = (value) => {
    // 비활성화된 옵션은 토글 불가
    if (disabled.includes(value)) {
      return;
    }

    if (selected.includes(value)) {
      // 이미 선택된 경우 제거
      onChange(selected.filter((item) => item !== value));
    } else {
      // 선택되지 않은 경우 추가
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-sm font-bold text-gray-700">{label}</label>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const isDisabled = disabled.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              disabled={isDisabled}
              className={`
                px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${
                  isSelected
                    ? "bg-indigo-100 border-indigo-500 text-indigo-700"
                    : isDisabled
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                    : "bg-white border-gray-300 text-gray-700 hover:border-indigo-300"
                }
              `}
            >
              {isSelected && "✓ "}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 범위 선택 컴포넌트 (예산 범위 등)
 * @param {string} label - 라벨
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @param {Array} value - [최소값, 최대값]
 * @param {function} onChange - 값 변경 핸들러
 */
export function RangeInput({
  label,
  min,
  max,
  value = [min, max],
  onChange,
  step = 1000,
}) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="text-sm font-bold text-gray-700">{label}</label>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{value[0].toLocaleString()}원</span>
          <span>~</span>
          <span>{value[1].toLocaleString()}원</span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
            className="w-full"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[1]}
            onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
