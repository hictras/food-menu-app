"use client";

import { useEffect } from "react";

export default function TitleThemeSync() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.title_size) {
          document.documentElement.style.setProperty("--title-size", data.title_size + "px");
        }
        if (data.title_color_light) {
          document.documentElement.style.setProperty("--title-color-light", data.title_color_light);
        }
        if (data.title_color_dark) {
          document.documentElement.style.setProperty("--title-color-dark", data.title_color_dark);
        }
        if (data.label_size) {
          document.documentElement.style.setProperty("--label-size", data.label_size + "px");
        }
        if (data.label_color_light) {
          document.documentElement.style.setProperty("--label-color-light", data.label_color_light);
        }
        if (data.label_color_dark) {
          document.documentElement.style.setProperty("--label-color-dark", data.label_color_dark);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
