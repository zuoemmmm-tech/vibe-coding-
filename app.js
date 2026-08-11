const storageKey = "decision-memory-local-v1";

const uid = () => crypto.randomUUID();
const today = () => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const state = JSON.parse(localStorage.getItem(storageKey) || "null") || {
  tab: "start",
  activeId: "",
  sourceText: "",
  prompt: "",
  context: "",
  goal: "更主动、更清醒地做长期选择",
  mode: "current",
  query: "",
  review: { actualChoice: "", result: "", worked: "", missed: "", nextRule: "" },
  insights: [
    {
      id: uid(),
      type: "goal",
      text: "未来 1-3 年的决策建议必须服务于用户主动设定的成长目标，而不是性格标签。",
      status: "accepted",
    },
  ],
  decisions: [
    {
      id: uid(),
      type: "past",
      title: "复盘：大学选专业听从他人建议",
      category: "历史决策",
      status: "reviewed",
      question: "当时是否应该优先选择稳定专业，而不是自己更感兴趣的方向？",
      background: "信息不足时更相信外部权威，自己没有主动验证专业内容和长期动力。",
      options: ["听从建议选择稳定专业", "主动调研后选择兴趣方向", "延迟决定并补充信息"],
      criteria: ["长期动力", "信息验证", "外部建议质量", "个人责任感"],
      risks: ["把他人的安全感误认为自己的目标", "低估长期兴趣不足带来的消耗"],
      actions: ["重大选择前至少访谈 3 个真实从业者", "把他人建议拆成事实、判断和情绪三部分"],
      lesson: "不能只接受权威建议，必须完成独立信息验证，再判断这个选择是否服务于自己的长期目标。",
      futureGoal: "更主动地为长期选择负责",
      createdAt: today(),
      review: {
        actualChoice: "选择了稳定专业",
        result: "短期安全，但长期动力不足",
        worked: "降低了家庭冲突和短期不确定性",
        missed: "没有验证自己的长期兴趣和真实学习内容",
        nextRule: "涉及长期投入的选择，先验证真实体验，再接受外部建议。",
      },
    },
  ],
};

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function inferInsights(raw) {
  const text = raw.trim();
  if (!text) return [];
  const insights = [];
  if (/mbti|infp|intj|enfp|istj|人格|性格|内向|外向/i.test(text)) {
    insights.push({
      id: uid(),
      type: "preference",
      text: "导入内容包含性格或人格测试线索，只能作为当前自我理解，不能作为能力上限或职业禁区。",
      status: "uncertain",
    });
  }
  if (/自由|意义|创造|自主|热爱|兴趣/i.test(text)) {
    insights.push({
      id: uid(),
      type: "value",
      text: "你可能重视自主性、意义感或创造空间，未来决策需要检查是否牺牲了长期动力。",
      status: "uncertain",
    });
  }
  if (/稳定|安全|收入|现金|风险|焦虑/i.test(text)) {
    insights.push({
      id: uid(),
      type: "constraint",
      text: "你对稳定性、收入或风险承受有明确关注，建议把现实约束量化，而不是只凭感受判断。",
      status: "uncertain",
    });
  }
  if (/拖延|冲突|表达|社交|坚持|内耗|逃避/i.test(text)) {
    insights.push({
      id: uid(),
      type: "risk",
      text: "导入资料提到可能想改善的行为模式，后续建议应转化为训练路径，而不是回避相关机会。",
      status: "change",
    });
  }
  if (!insights.length) {
    insights.push({
      id: uid(),
      type: "preference",
      text: `已保存一段起点资料：${text.slice(0, 56)}${text.length > 56 ? "..." : ""}`,
      status: "uncertain",
    });
  }
  return insights;
}

function buildDecision() {
  const isPast = state.mode === "past";
  const accepted = state.insights.filter((item) => item.status !== "uncertain").slice(0, 2).map((item) => item.text);
  const title = state.prompt.length > 22 ? `${state.prompt.slice(0, 22)}...` : state.prompt;
  return {
    id: uid(),
    type: state.mode,
    title: isPast ? `复盘：${title}` : title,
    category: isPast ? "历史决策" : "当前决策",
    status: isPast ? "reviewed" : "thinking",
    question: state.prompt,
    background: state.context || (isPast ? "这是一段过去重要经历，需要区分当时事实、当时想法、后来结果和现在解释。" : "这是一个正在发生的选择，需要先补齐背景、约束和判断标准。"),
    options: isPast ? ["当时实际选择", "当时没有选择的替代方案", "现在回看更优的验证方案"] : ["保持现状", "进入新选择", "设置低成本验证期后再决定"],
    criteria: ["是否服务未来目标", "现实约束是否可承受", "信息是否充分", "是否重复过去的失败模式"],
    risks: ["用性格标签替代真实验证", "把短期情绪当成长期目标", "只看机会收益，低估执行成本", ...accepted.slice(0, 1)],
    actions: ["列出这个选择必须验证的 3 个事实", "设定一个低成本试运行或信息收集窗口", "写下如果失败，最坏结果是否可承受", "检查这个选择是否让你靠近未来目标"],
    lesson: isPast ? "这段经历的价值不是证明你过去是什么样的人，而是提炼未来可调用的判断规则。" : "先不要追求一次性做出完美决定，应该把决定拆成可验证的小步骤。",
    futureGoal: state.goal || "先明确未来 1-3 年想靠近的状态，再判断当前选择是否服务于这个方向。",
    createdAt: today(),
  };
}

function icon(name) {
  const icons = { start: "✚", profile: "◎", library: "▤", assistant: "⌕", detail: "□" };
  return icons[name] || "•";
}

function render() {
  save();
  const app = document.querySelector("#app");
  const active = state.decisions.find((item) => item.id === state.activeId) || state.decisions[0];
  app.innerHTML = `
    <aside>
      <div class="brand"><div class="mark">DM</div><div><strong>Decision Memory</strong><span>个人决策系统</span></div></div>
      <nav>
        ${navButton("start", "开始")}
        ${navButton("profile", "起点档案")}
        ${navButton("library", "决策库")}
        ${navButton("assistant", "决策助手")}
      </nav>
      <div class="side-note">过去是证据，测试是参考，未来目标才是方向。</div>
    </aside>
    <section class="content">${view(active)}</section>
  `;
  bindEvents();
}

function navButton(tab, label) {
  return `<button data-tab="${tab}" class="${state.tab === tab ? "active" : ""}">${icon(tab)} ${label}</button>`;
}

function view(active) {
  if (state.tab === "profile") return profileView();
  if (state.tab === "library") return libraryView();
  if (state.tab === "assistant") return assistantView();
  if (state.tab === "detail" && active) return detailView(active);
  return startView();
}

function startView() {
  return `
    <div class="grid two">
      <section class="panel">
        <div class="panel-title"><span>${icon("start")}</span><h1>从一个真实选择开始</h1></div>
        <div class="segmented">
          <button data-mode="current" class="${state.mode === "current" ? "active" : ""}">当前决定</button>
          <button data-mode="past" class="${state.mode === "past" ? "active" : ""}">过去经历</button>
        </div>
        <label>${state.mode === "current" ? "你现在正在犹豫什么？" : "哪段过去经历仍然影响你？"}
          <textarea id="prompt" placeholder="${state.mode === "current" ? "例如：我要不要离开稳定工作，加入创业公司？" : "例如：当年选专业时听从建议，后来长期后悔。"}">${state.prompt}</textarea>
        </label>
        <label>补充背景
          <textarea id="context" placeholder="写下当时/现在的处境、约束、担心、已有选项。">${state.context}</textarea>
        </label>
        <label>未来目标校准
          <input id="goal" value="${escapeHtml(state.goal)}" />
        </label>
        <button class="primary" id="create">生成决策卡片</button>
      </section>
      <section class="panel">
        <div class="panel-title"><span>↥</span><h2>导入已有资料，降低冷启动</h2></div>
        <p class="muted">可粘贴 MBTI、Big Five、年度总结、简历、自我介绍、过往复盘或 AI 对话摘要。系统只把它们当起点资料，不会用标签限制你。</p>
        <textarea id="sourceText" placeholder="把已有资料粘贴到这里。">${state.sourceText}</textarea>
        <button class="secondary" id="import">提取起点理解</button>
      </section>
    </div>`;
}

function profileView() {
  return `
    <section class="panel">
      <div class="panel-title"><span>${icon("profile")}</span><h1>个人起点档案</h1></div>
      <p class="muted">请校准系统提取的理解：准确的保留，想突破的标为“想改变”。这样产品会帮助你走向未来目标，而不是维持旧标签。</p>
      <div class="insights">
        ${state.insights.map((item) => `
          <article class="insight">
            <span>${item.type}</span>
            <p>${escapeHtml(item.text)}</p>
            <div class="chips">
              ${chip(item, "accepted", "准确")}
              ${chip(item, "keep", "想保留")}
              ${chip(item, "change", "想改变")}
              ${chip(item, "uncertain", "不确定")}
            </div>
          </article>
        `).join("")}
      </div>
    </section>`;
}

function chip(item, status, label) {
  return `<button data-insight="${item.id}" data-status="${status}" class="${item.status === status ? "selected" : ""}">${label}</button>`;
}

function libraryView() {
  return `
    <section class="panel">
      <div class="panel-title"><span>${icon("library")}</span><h1>我的决策库</h1></div>
      <div class="cards">
        ${state.decisions.map((item) => `
          <article class="decision-card" data-open="${item.id}">
            <div><span>${item.category}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.question)}</p></div>
            <button data-delete="${item.id}" aria-label="删除">×</button>
          </article>
        `).join("")}
      </div>
    </section>`;
}

function assistantView() {
  const q = state.query.trim().toLowerCase();
  const related = (q
    ? state.decisions.filter((item) => [item.title, item.question, item.background, item.lesson, item.category].join(" ").toLowerCase().includes(q))
    : state.decisions).slice(0, 3);
  const accepted = state.insights.filter((item) => item.status !== "uncertain").slice(0, 3);
  return `
    <section class="panel">
      <div class="panel-title"><span>${icon("assistant")}</span><h1>基于个人历史的决策助手</h1></div>
      <input id="query" value="${escapeHtml(state.query)}" placeholder="例如：我要不要裸辞做副业？" />
      <div class="assistant-result">
        <h2>找到的相关证据</h2>
        ${related.map((item) => `<article><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.lesson)}</p></article>`).join("") || "<p class='muted'>还没有找到相关记录，可以先补充一个过去经历或当前决定。</p>"}
        <h2>建议框架</h2>
        <p>不要直接问“适不适合”，先问：这个选择是否靠近未来目标、是否重复过去的失败模式、是否有低成本验证路径、最坏结果是否可承受。</p>
        ${accepted.length ? `<p>已参考你的起点档案：${accepted.map((item) => escapeHtml(item.text)).join("；")}</p>` : ""}
      </div>
    </section>`;
}

function detailView(item) {
  return `
    <section class="panel detail">
      <div class="panel-title"><span>${icon("detail")}</span><h1>${escapeHtml(item.title)}</h1></div>
      <div class="status-row"><span>${item.category}</span><span>${item.createdAt}</span><span>${statusText(item.status)}</span></div>
      ${block("一句话问题", item.question)}
      ${block("背景", item.background)}
      ${list("可选方案", item.options)}
      ${list("关键判断标准", item.criteria)}
      ${list("主要风险", item.risks)}
      ${list("下一步验证动作", item.actions)}
      ${block("未来目标校准", item.futureGoal)}
      ${block("经验沉淀", item.lesson)}
      <div class="review">
        <div class="panel-title"><span>↻</span><h2>复盘</h2></div>
        ${item.review ? reviewed(item.review) : reviewForm()}
      </div>
    </section>`;
}

function block(title, text) {
  return `<div class="block"><strong>${title}</strong><p>${escapeHtml(text)}</p></div>`;
}

function list(title, items) {
  return `<div class="block"><strong>${title}</strong><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function reviewed(review) {
  return `${block("最终选择", review.actualChoice)}${block("实际结果", review.result)}${block("判断正确处", review.worked)}${block("忽略之处", review.missed)}${block("下次规则", review.nextRule)}`;
}

function reviewForm() {
  const fields = {
    actualChoice: "你最后做了什么选择？",
    result: "结果比预期更好、更差，还是差不多？",
    worked: "当时判断正确的地方是什么？",
    missed: "当时忽略了什么？",
    nextRule: "下次遇到类似情况，你会怎么做？",
  };
  return `<div class="review-grid">${Object.entries(fields).map(([key, label]) => `<input data-review="${key}" value="${escapeHtml(state.review[key])}" placeholder="${label}" />`).join("")}<button class="primary" id="saveReview">保存复盘</button></div>`;
}

function statusText(status) {
  return status === "thinking" ? "思考中" : status === "review_due" ? "待复盘" : "已复盘";
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.tab = button.dataset.tab; render(); }));
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => { state.mode = button.dataset.mode; render(); }));
  document.querySelector("#prompt")?.addEventListener("input", (event) => { state.prompt = event.target.value; save(); });
  document.querySelector("#context")?.addEventListener("input", (event) => { state.context = event.target.value; save(); });
  document.querySelector("#goal")?.addEventListener("input", (event) => { state.goal = event.target.value; save(); });
  document.querySelector("#sourceText")?.addEventListener("input", (event) => { state.sourceText = event.target.value; save(); });
  document.querySelector("#query")?.addEventListener("input", (event) => { state.query = event.target.value; save(); render(); });
  document.querySelector("#import")?.addEventListener("click", () => {
    state.insights.unshift(...inferInsights(state.sourceText));
    state.sourceText = "";
    state.tab = "profile";
    render();
  });
  document.querySelector("#create")?.addEventListener("click", () => {
    if (!state.prompt.trim()) return;
    const decision = buildDecision();
    state.decisions.unshift(decision);
    state.activeId = decision.id;
    state.prompt = "";
    state.context = "";
    state.tab = "detail";
    render();
  });
  document.querySelectorAll("[data-insight]").forEach((button) => button.addEventListener("click", () => {
    const item = state.insights.find((insight) => insight.id === button.dataset.insight);
    if (item) item.status = button.dataset.status;
    render();
  }));
  document.querySelectorAll("[data-open]").forEach((card) => card.addEventListener("click", () => {
    state.activeId = card.dataset.open;
    state.tab = "detail";
    render();
  }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    state.decisions = state.decisions.filter((item) => item.id !== button.dataset.delete);
    render();
  }));
  document.querySelectorAll("[data-review]").forEach((input) => input.addEventListener("input", (event) => { state.review[input.dataset.review] = event.target.value; save(); }));
  document.querySelector("#saveReview")?.addEventListener("click", () => {
    const item = state.decisions.find((decision) => decision.id === state.activeId);
    if (!item) return;
    item.status = "reviewed";
    item.review = { ...state.review };
    state.review = { actualChoice: "", result: "", worked: "", missed: "", nextRule: "" };
    render();
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

render();
