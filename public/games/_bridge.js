/**
 * Arcade Hub 成绩桥
 * 站内游戏引入此脚本后，调用 ArcadeBridge.submitScore(score)
 * 即可把成绩上报给外层页面写入排行榜。
 */
(function () {
  // 游戏与外层页面同源，所以目标源就是自己的 origin；
  // 若写成通配目标，消息会被广播给任何把本站页面嵌入的第三方宿主。
  var target = window.location.origin;

  function send(payload) {
    try {
      parent.postMessage(payload, target);
    } catch {
      /* 不在 iframe 中时忽略 */
    }
  }

  window.ArcadeBridge = {
    submitScore: function (score) {
      var n = Number(score);
      if (!Number.isFinite(n)) return;
      send({ type: "arcade:score", score: Math.round(n) });
    },
  };
})();

