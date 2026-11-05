import { SurveyTerminal } from "./survey";
import { initPwa, pwaSettingsMarkup } from "./pwa";
import { QUESTIONNAIRE_VERSION } from "./questionnaire";
import "./research.css";
import "./survey.css";

const app = document.querySelector<HTMLElement>("#app")!;
const arrow = '<span aria-hidden="true">↗</span>';

app.innerHTML = `
  <a class="skip-link" href="#page-content">跳到主要内容</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="site-brand" href="#home" aria-label="大学生婚恋调查首页">
        <img src="/survey-mark.svg" width="42" height="42" alt="">
        <span><strong>大学生婚恋调查</strong><small>STUDENT RELATIONSHIP SURVEY</small></span>
      </a>
      <nav class="site-nav" aria-label="主要导航">
        <a href="#home" data-page="home">调查首页</a>
        <a href="#questionnaire" data-page="questionnaire">填写问卷</a>
        <a href="#submissions" data-page="submissions">提交记录</a>
        <a href="#about" data-page="about">调查说明</a>
      </nav>
    </div>
  </header>
  <div id="page-content" tabindex="-1">
    <main id="home-view">
      <section class="survey-hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="section-label"><span></span> 思政实践 · 在校大学生专题调查</p>
          <h1 id="hero-title" tabindex="-1">大学生婚恋<br><em>意愿调查</em></h1>
          <p class="hero-description">关于亲密关系、生活选择与未来。<br>了解你的真实想法，也关注你需要的支持。</p>
          <div class="hero-actions">
            <a href="#questionnaire" class="primary-button"><span data-draft-label>参与问卷调查</span><span aria-hidden="true">→</span></a>
            <a href="#about" class="text-link">了解调查说明 ${arrow}</a>
          </div>
          <p class="hero-note">自愿参与 · 昵称选填 · 可随时暂停并保留草稿</p>
        </div>
        <div class="hero-cover" aria-hidden="true">
          <div class="cover-topline"><span>关系 · 选择 · 未来</span><span>专题调查</span></div>
          <div class="cover-paths">
            <div class="path-circle circle-one"></div><div class="path-circle circle-two"></div>
            <div class="path-circle circle-three"></div><span class="path-point point-one"></span><span class="path-point point-two"></span>
            <span class="path-label label-one">个人成长</span><span class="path-label label-two">亲密关系</span><span class="path-label label-three">共同生活</span>
          </div>
          <div class="cover-caption"><span>倾听不同想法<br>理解真实需要</span><small>UNIVERSITY STUDENT<br>RELATIONSHIP STUDY</small></div>
        </div>
      </section>
      <section class="participation-facts page-width" aria-label="参与信息">
        <div><span class="fact-label">调查对象</span><strong>高校在读学生</strong><p>专科、本科、硕士、博士等在读阶段</p></div>
        <div><span class="fact-label">问卷内容</span><strong>26 道题，按情况跳题</strong><p>4 道基本情况 · 20 道主体题 · 2 道选答</p></div>
        <div><span class="fact-label">参与方式</span><strong>自愿填写，自主选择</strong><p>不要求姓名、学号或联系方式</p></div>
      </section>
      <section class="study-topics page-width" aria-labelledby="topics-title">
        <div class="section-heading"><div><p class="section-label">调查关注</p><h2 id="topics-title">从当下的想法，到未来的安排</h2></div><p>记录现阶段的选择，<br>每个人都可以有自己的答案。</p></div>
        <div class="topic-grid">
          <article><span class="topic-number">01</span><h3>意愿与行动</h3><p>对亲密关系与婚姻的想法，以及近期的经历和计划。</p><span class="topic-keywords">关系意愿 / 交往经历 / 未来计划</span></article>
          <article><span class="topic-number">02</span><h3>现实与选择</h3><p>学业、就业、住房与家庭期待，如何进入你的婚恋考虑。</p><span class="topic-keywords">现实条件 / 外部影响 / 情景选择</span></article>
          <article><span class="topic-number">03</span><h3>沟通与支持</h3><p>相处中的沟通、共同生活的安排，以及你希望获得的帮助。</p><span class="topic-keywords">相互理解 / 生活分工 / 支持需求</span></article>
        </div>
      </section>
      <section id="about" class="study-about page-width" aria-labelledby="about-title">
        <div class="about-intro"><p class="section-label">参与之前</p><h2 id="about-title" tabindex="-1">一份问卷，<br>从如实表达开始。</h2><p>本调查用于思政实践课的大学生婚恋主题研究。回答反映你现阶段的想法，按自己的实际情况填写即可。</p><a href="#questionnaire" class="text-link">阅读填写说明并开始 ${arrow}</a></div>
        <div class="about-details">
          <article><span>01</span><div><h3>了解用途，自愿参与</h3><p>面向高校在读学生，包括已婚同学。问卷根据婚姻与伴侣状态调整适用题目；可以选择“不愿回答”，选答题可以跳过。</p></div></article>
          <article><span>02</span><div><h3>按实际情况填写，草稿自动保留</h3><p>在同一浏览器中可暂停后继续。填写完毕后先核对回答，再提交；提交是否成功会明确提示，也可导出自己的回答。</p></div></article>
          <article><span>03</span><div><h3>个人回答默认不公开</h3><p>只有你主动勾选，昵称与选择题回答（含基本情况）才会进入公开记录。所有补充文字与开放回答始终不公开。请勿填写自己或他人的身份信息。</p></div></article>
          <p class="about-footnote">服务端保存匿名编号、提交时间、昵称和逐题回答。本机副本与草稿保存在当前浏览器；更换设备或清除浏览器数据后无法自动找回未公开的回答。</p>
        </div>
      </section>
      <section class="participation-banner page-width"><div><p class="section-label">你的声音，是调查的一部分</p><h2>记录此刻的想法。</h2></div><a href="#questionnaire" class="primary-button"><span data-draft-label>参与问卷调查</span><span aria-hidden="true">→</span></a></section>
    </main>
    <section id="survey-ui" class="survey-embedded" aria-label="问卷与提交记录" hidden></section>
  </div>
  <footer class="site-footer page-width">
    <div><strong>大学生婚恋意愿调查</strong><span>思政实践 · 自愿参与 · 如实表达</span></div>
    <div class="footer-links"><span id="connection-state" role="status">正在连接问卷服务</span><button type="button" id="pwa-update-notice" data-pwa-action="update" hidden>新版本已就绪 · 更新并重启</button><button type="button" id="open-device">安装与更新</button><a href="https://github.com/rk-3588/questionnaire" target="_blank" rel="noopener noreferrer">项目与来源 ${arrow}</a></div>
    <p>基于 <a href="https://github.com/LBEILC/RhineLabUI" target="_blank" rel="noopener noreferrer">RhineLabUI</a> 二次开发 · 问卷版本 ${QUESTIONNAIRE_VERSION}</p>
  </footer>
  <dialog id="device-dialog" aria-labelledby="device-title"><div class="device-heading"><h2 id="device-title">安装与更新</h2><button type="button" id="close-device" aria-label="关闭安装与更新">×</button></div>${pwaSettingsMarkup()}<p>离线时可填写并保留本机草稿；提交到服务器需要联网。</p><a class="text-link" href="/update.html">打开更新页面 ${arrow}</a></dialog>
  <p id="app-notice" class="app-notice" role="status" hidden></p>
`;

const root = app.querySelector<HTMLElement>("#survey-ui")!;
const home = app.querySelector<HTMLElement>("#home-view")!;
const survey = new SurveyTerminal(root);
const pages = new Set(["home", "questionnaire", "submissions", "about"]);
let activePage = "home";

function setNavigation(page: string) {
  for (const link of app.querySelectorAll<HTMLAnchorElement>("[data-page]")) {
    if (link.dataset.page === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.title = `${page === "submissions" ? "提交与公开记录" : page === "questionnaire" ? "填写问卷" : "大学生婚恋意愿调查"} · 思政实践`;
}

function updateConnection() {
  const state = survey.getConnectionState();
  const element = app.querySelector<HTMLElement>("#connection-state")!;
  element.dataset.state = state;
  element.textContent = {
    loading: "正在连接问卷服务",
    connected: "问卷服务已连接",
    offline: "服务暂不可用 · 可保留本机草稿",
  }[state];
}

function updateDraft() {
  for (const label of app.querySelectorAll("[data-draft-label]"))
    label.textContent = survey.hasDraft() ? "继续填写问卷" : "参与问卷调查";
}

function showRoute() {
  const hash = location.hash.slice(1);
  // Old bookmarks now lead to the actual questionnaire rather than a game scene.
  activePage = pages.has(hash) ? hash : "home";
  if (activePage === "questionnaire" || activePage === "submissions") {
    home.hidden = true;
    survey.show(activePage === "submissions" ? "archive" : "resume");
  } else {
    survey.hide();
    home.hidden = false;
    if (activePage === "about")
      document.getElementById("about-title")!.focus({ preventScroll: true });
    else if (hash === "home")
      document.getElementById("hero-title")!.focus({ preventScroll: true });
    if (hash === "page-content")
      document.getElementById("page-content")!.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      if (activePage === "about")
        document.getElementById("about")!.scrollIntoView({ block: "start" });
      else window.scrollTo(0, 0);
    });
  }
  setNavigation(activePage);
}

root.addEventListener("survey:return-system", () => {
  location.hash = "home";
});
root.addEventListener("survey:connection-updated", updateConnection);
root.addEventListener("survey:pool-updated", updateConnection);
root.addEventListener("survey:draft-updated", updateDraft);
root.addEventListener("survey:view-updated", () => {
  if (root.hidden) return;
  const page = ["archive", "profile"].includes(root.dataset.view ?? "")
    ? "submissions"
    : "questionnaire";
  if (activePage !== page) {
    activePage = page;
    history.replaceState(null, "", `#${page}`);
    setNavigation(page);
  }
});
window.addEventListener("hashchange", showRoute);

const dialog = app.querySelector<HTMLDialogElement>("#device-dialog")!;
app
  .querySelector("#open-device")!
  .addEventListener("click", () => dialog.showModal());
app
  .querySelector("#close-device")!
  .addEventListener("click", () => dialog.close());

let noticeTimer: ReturnType<typeof setTimeout>;
void initPwa((message) => {
  const notice = app.querySelector<HTMLElement>("#app-notice")!;
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.hidden = true;
  }, 6000);
});
showRoute();
updateConnection();
updateDraft();
