/**
 * Arcade Hub 成绩桥
 * 站内游戏引入此脚本后，调用 ArcadeBridge.submitScore(score)
 * 即可把成绩上报给外层页面写入排行榜。
 */
(function () {
  window.ArcadeBridge = {
    submitScore: function (score) {
      try {
        parent.postMessage({ type: "arcade:score", score: Math.round(score) }, "*");
      } catch (e) {
        /* 不在 iframe 中时忽略 */
      }
    },
  };
})();
