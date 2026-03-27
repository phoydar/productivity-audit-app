import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname, ".."),
    ignoreIssue: [
      {
        path: "**",
        description: /resolve 'tailwindcss'/,
      },
    ],
  }
}

export default nextConfig
