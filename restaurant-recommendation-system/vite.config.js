import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite 빌드 도구 설정
export default defineConfig({
  plugins: [
    react(), // React 플러그인
    tailwindcss() // Tailwind CSS 플러그인
  ],
  resolve: {
    // 경로 별칭 설정 - import 경로를 짧게 사용하기 위함
    alias: [
      { find: "@", replacement: "/src" },
      { find: "@assets", replacement: "/src/assets" },
      { find: "@components", replacement: "/src/components" },
      { find: "@common", replacement: "/src/components/common" },
      { find: "@pages", replacement: "/src/pages" },
      { find: "@utils", replacement: "/src/utils" },
      { find: "@hooks", replacement: "/src/hooks" },
    ],
  },
  server: {
    // 개발 서버 프록시 설정 (CORS 우회)
    proxy: {
      '/maps/api': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/maps\/api/, '/maps/api'),
      },
    },
  },
});
