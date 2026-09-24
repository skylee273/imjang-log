import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 상대 경로 base → GitHub Pages(/imjang-log/) 와 로컬 모두 동작
export default defineConfig({
  base: './',
  plugins: [react()],
})
