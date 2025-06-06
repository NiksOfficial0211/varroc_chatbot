// hooks/useScrollCounter.ts
import { useEffect } from "react";
import $ from "jquery";

export const useScrollCounter = () => {
  useEffect(() => {
    const inVisible = (el: JQuery<HTMLElement>) => {
      const wTop = $(window).scrollTop() || 0;
      const eTop = el.offset()?.top || 0;
      const wHeight = $(window).height() || 0;
      const dHeight = $(document).height() || 0;
      const eHeight = el.outerHeight() || 0;

      if (
        wTop + wHeight >= eTop ||
        wHeight + wTop === dHeight ||
        eHeight + eTop < wHeight
      ) {
        if (!el.hasClass("ms-animated")) {
          el.addClass("ms-animated");
          const max = parseInt(el.attr("data-max") || "0");
          let current = 0;
          const interval = setInterval(() => {
            if (current >= max) {
              clearInterval(interval);
              el.text(max);
            } else {
              el.text(current);
              current++;
            }
          }, 20);
        }
      }
    };

    const onScroll = () => {
      $("span[data-max]").each(function () {
        inVisible($(this));
      });
    };

    $(window).on("scroll", onScroll);
    onScroll(); // also trigger on mount

    return () => {
      $(window).off("scroll", onScroll);
    };
  }, []);
};
