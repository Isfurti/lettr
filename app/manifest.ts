import type { MetadataRoute } from "next";

/** Lets people add Lettr to their phone's home screen and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lettr: AI Resume Builder",
    short_name: "Lettr",
    description: "Build a job-ready resume, check your match, practise interviews and track applications.",
    start_url: "/dashboard?source=app",
    scope: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#041632",
    orientation: "portrait",
    categories: ["productivity", "business", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New resume", url: "/builder/new" },
      { name: "Applications", url: "/dashboard/applications" },
      { name: "Interview practice", url: "/dashboard/interview" },
    ],
  };
}
