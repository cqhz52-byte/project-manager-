const STORAGE_KEY = "simple-project-manager-data-v3";
const STATUSES = ["待处理", "进行中", "已完成"];
const DEFAULT_OWNER = "小陈";

const seedData = {
  projects: [
    {
      id: crypto.randomUUID(),
      name: "DeepSeek 销售助手",
      owner: "小陈",
      deadline: "2026-05-23",
      summary: "面向手机端的 AI 助手试点，重点优化客户提问录入、答案卡片展示和跟进建议。",
      updates: [
        {
          id: crypto.randomUUID(),
          createdAt: "2026-05-15 18:20",
          content: "已经整理出销售高频提问模板，先覆盖报价、交付周期和售后说明。"
        },
        {
          id: crypto.randomUUID(),
          createdAt: "2026-05-16 09:30",
          content: "明确移动端输入区必须保留在第一屏，优先优化单手输入体验。"
        }
      ],
      tasks: [
        {
          id: crypto.randomUUID(),
          title: "整理高频提问模板",
          assignee: "小陈",
          priority: "高",
          status: "已完成",
          note: "优先覆盖报价、交付周期和售后说明。"
        },
        {
          id: crypto.randomUUID(),
          title: "优化移动端输入区",
          assignee: "阿杰",
          priority: "高",
          status: "进行中",
          note: "输入框和发送按钮要适合单手操作。"
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      name: "AI 官网改版",
      owner: "阿杰",
      deadline: "2026-05-28",
      summary: "突出 DeepSeek 场景和 AI 能力，让访客一眼理解产品价值。",
      updates: [
        {
          id: crypto.randomUUID(),
          createdAt: "2026-05-14 16:40",
          content: "案例模块已经补完两组行业案例，官网 AI 气质比之前更清晰。"
        }
      ],
      tasks: [
        {
          id: crypto.randomUUID(),
          title: "重写首屏文案",
          assignee: "阿杰",
          priority: "中",
          status: "待处理",
          note: "围绕行业场景、响应速度和移动体验来写。"
        },
        {
          id: crypto.randomUUID(),
          title: "补充案例模块",
          assignee: "小陈",
          priority: "中",
          status: "已完成",
          note: "已经整理出零售和教育两个案例。"
        }
      ]
    }
  ]
};

const projectForm = document.querySelector("#projectForm");
const taskForm = document.querySelector("#taskForm");
const projectBoard = document.querySelector("#projectBoard");
const metrics = document.querySelector("#metrics");
const taskProject = document.querySelector("#taskProject");
const taskPriority = document.querySelector("#taskPriority");
const taskStatus = document.querySelector("#taskStatus");
const ownerFilter = document.querySelector("#ownerFilter");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const resetDataButton = document.querySelector("#resetData");
const projectCardTemplate = document.querySelector("#projectCardTemplate");
const taskItemTemplate = document.querySelector("#taskItemTemplate");
const aiInput = document.querySelector("#aiInput");
const aiCreateButton = document.querySelector("#aiCreateButton");
const aiFillProjectButton = document.querySelector("#aiFillProjectButton");
const aiFeedback = document.querySelector("#aiFeedback");
const aiResult = document.querySelector("#aiResult");
const quickChips = document.querySelector("#quickChips");
const projectNameInput = document.querySelector("#projectName");
const projectOwnerInput = document.querySelector("#projectOwner");
const projectDeadlineInput = document.querySelector("#projectDeadline");
const projectSummaryInput = document.querySelector("#projectSummary");

let state = loadState();

function ensureProjectShape(project) {
  if (!Array.isArray(project.tasks)) project.tasks = [];
  if (!Array.isArray(project.updates)) project.updates = [];
  return project;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedData);

  try {
    const parsed = JSON.parse(saved);
    parsed.projects = (parsed.projects || []).map(ensureProjectShape);
    return parsed;
  } catch {
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function projectProgress(project) {
  if (!project.tasks.length) return 0;
  const done = project.tasks.filter((task) => task.status === "已完成").length;
  return Math.round((done / project.tasks.length) * 100);
}

function latestUpdates(project, limit = 3) {
  return [...project.updates].slice(0, limit);
}

function completedTasks(project) {
  return project.tasks.filter((task) => task.status === "已完成");
}

function pendingTasks(project) {
  return project.tasks.filter((task) => task.status !== "已完成");
}

function filteredProjects() {
  const keyword = searchInput.value.trim().toLowerCase();
  const owner = ownerFilter.value;
  const status = statusFilter.value;

  return state.projects.filter((project) => {
    ensureProjectShape(project);
    const byOwner = !owner || project.owner === owner;
    const byStatus = !status || project.tasks.some((task) => task.status === status);
    const haystack = [
      project.name,
      project.owner,
      project.summary,
      "DeepSeek",
      "AI",
      ...project.updates.map((update) => update.content),
      ...project.tasks.flatMap((task) => [task.title, task.assignee, task.note])
    ]
      .join(" ")
      .toLowerCase();

    const byKeyword = !keyword || haystack.includes(keyword);
    return byOwner && byStatus && byKeyword;
  });
}

function renderMetrics(projects) {
  const allTasks = projects.flatMap((project) => project.tasks);
  const totalProjects = projects.length;
  const totalTasks = allTasks.length;
  const doingTasks = allTasks.filter((task) => task.status === "进行中").length;
  const urgentTasks = allTasks.filter((task) => task.priority === "高" && task.status !== "已完成").length;

  const cards = [
    { label: "AI 项目", value: totalProjects },
    { label: "任务总数", value: totalTasks },
    { label: "进行中", value: doingTasks },
    { label: "待优先处理", value: urgentTasks }
  ];

  metrics.innerHTML = cards
    .map(
      (card) => `
        <article class="metric-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderProjectOptions() {
  const currentValue = taskProject.value;
  const options = state.projects
    .map((project) => `<option value="${project.id}">${project.name}</option>`)
    .join("");

  taskProject.innerHTML = options || '<option value="">请先创建项目</option>';
  taskProject.disabled = !state.projects.length;

  if (state.projects.some((project) => project.id === currentValue)) {
    taskProject.value = currentValue;
  }
}

function renderOwnerOptions() {
  const currentValue = ownerFilter.value;
  const owners = [...new Set(state.projects.map((project) => project.owner))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  );

  ownerFilter.innerHTML =
    '<option value="">全部负责人</option>' +
    owners.map((owner) => `<option value="${owner}">${owner}</option>`).join("");
  ownerFilter.value = owners.includes(currentValue) ? currentValue : "";
}

function taskColumn(project, status) {
  const column = document.createElement("section");
  column.className = "task-column";

  const tasks = project.tasks.filter((task) => task.status === status);
  const title = document.createElement("h4");
  title.textContent = `${status} · ${tasks.length}`;
  column.appendChild(title);

  const list = document.createElement("div");
  list.className = "task-list";

  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "column-empty";
    empty.textContent = "暂无任务";
    list.appendChild(empty);
  } else {
    tasks.forEach((task) => {
      const fragment = taskItemTemplate.content.cloneNode(true);
      const item = fragment.querySelector(".task-item");
      fragment.querySelector(".task-title").textContent = task.title;
      fragment.querySelector(".task-assignee").textContent = `负责人：${task.assignee || "未指定"}`;
      fragment.querySelector(".task-note").textContent = task.note || "暂无备注";

      const pill = fragment.querySelector(".priority-pill");
      pill.textContent = task.priority;
      pill.classList.add(
        task.priority === "高"
          ? "priority-high"
          : task.priority === "中"
            ? "priority-medium"
            : "priority-low"
      );

      const select = fragment.querySelector(".task-status-select");
      select.value = task.status;
      select.addEventListener("change", () => updateTaskStatus(project.id, task.id, select.value));

      fragment.querySelector(".delete-task").addEventListener("click", () => deleteTask(project.id, task.id));
      item.dataset.taskId = task.id;
      list.appendChild(fragment);
    });
  }

  column.appendChild(list);
  return column;
}

function renderBoard() {
  const projects = filteredProjects();
  renderProjectOptions();
  renderOwnerOptions();
  renderMetrics(projects);

  if (!projects.length) {
    projectBoard.innerHTML = '<div class="empty-state">当前没有符合筛选条件的项目。</div>';
    return;
  }

  projectBoard.innerHTML = "";
  projects.forEach((project) => {
    ensureProjectShape(project);
    const fragment = projectCardTemplate.content.cloneNode(true);
    fragment.querySelector(".project-tag").textContent = "AI / DeepSeek 项目";
    fragment.querySelector(".project-title").textContent = project.name;
    fragment.querySelector(".project-meta").textContent =
      `负责人：${project.owner} · 截止：${project.deadline || "未设置"}`;
    fragment.querySelector(".project-summary").textContent = project.summary || "暂无说明";

    const updates = latestUpdates(project);
    const summaryNode = fragment.querySelector(".project-summary");
    if (updates.length) {
      const updatesWrap = document.createElement("div");
      updatesWrap.className = "project-updates";
      updates.forEach((update) => {
        const item = document.createElement("article");
        item.className = "update-item";
        item.innerHTML = `<strong>${update.createdAt}</strong><p>${update.content}</p>`;
        updatesWrap.appendChild(item);
      });
      summaryNode.insertAdjacentElement("afterend", updatesWrap);
    }

    const progress = projectProgress(project);
    fragment.querySelector(".progress-bar span").style.width = `${progress}%`;
    fragment.querySelector(".progress-text").textContent = `${progress}% 完成`;

    fragment.querySelector(".delete-project").addEventListener("click", () => deleteProject(project.id));
    const columns = fragment.querySelector(".task-columns");
    STATUSES.forEach((status) => columns.appendChild(taskColumn(project, status)));
    projectBoard.appendChild(fragment);
  });
}

function setAiFeedback(message) {
  aiFeedback.textContent = message;
}

function setAiResult(html = "") {
  aiResult.innerHTML = html;
  aiResult.classList.toggle("is-visible", Boolean(html));
}

function addProject(event) {
  event.preventDefault();
  const formData = new FormData(projectForm);

  state.projects.unshift({
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    owner: String(formData.get("owner")).trim(),
    deadline: String(formData.get("deadline")).trim(),
    summary: String(formData.get("summary")).trim(),
    updates: [],
    tasks: []
  });

  projectForm.reset();
  saveState();
  renderBoard();
  setAiFeedback("项目已创建，现在可以继续用上方 AI 输入区快速补任务或记项目进展。");
}

function addTask(event) {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const project = state.projects.find((item) => item.id === formData.get("projectId"));
  if (!project) return;

  project.tasks.unshift({
    id: crypto.randomUUID(),
    title: String(formData.get("title")).trim(),
    assignee: String(formData.get("assignee")).trim() || project.owner,
    priority: String(formData.get("priority")).trim(),
    status: String(formData.get("status")).trim(),
    note: String(formData.get("note")).trim()
  });

  taskForm.reset();
  taskPriority.value = "中";
  taskStatus.value = "待处理";
  taskProject.value = project.id;
  saveState();
  renderBoard();
  setAiFeedback(`任务已加入「${project.name}」，你也可以继续用自然语言补充项目进展。`);
}

function updateTaskStatus(projectId, taskId, status) {
  const project = state.projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.status = status;
  saveState();
  renderBoard();
}

function deleteTask(projectId, taskId) {
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;

  project.tasks = project.tasks.filter((task) => task.id !== taskId);
  saveState();
  renderBoard();
}

function deleteProject(projectId) {
  state.projects = state.projects.filter((project) => project.id !== projectId);
  saveState();
  renderBoard();
}

function resetSeedData() {
  state = structuredClone(seedData);
  saveState();
  renderBoard();
  setAiResult("");
  setAiFeedback("示例数据已恢复，现在更偏一句话查进度和一句话记进展的 AI 管理方式。");
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeCompareText(text) {
  return text.replace(/\s+/g, "").toLowerCase();
}

function extractOwner(text) {
  const match = text.match(/负责人[：:\s]*([^\s，。,]+)/);
  return match?.[1] || DEFAULT_OWNER;
}

function extractDeadline(text) {
  const iso = text.match(/(20\d{2}-\d{2}-\d{2})/);
  return iso?.[1] || "";
}

function detectPriority(text) {
  if (/(高优先级|紧急|优先|马上)/.test(text)) return "高";
  if (/(低优先级|不急|稍后)/.test(text)) return "低";
  return "中";
}

function detectStatus(text) {
  if (/(已完成|完成了|done)/i.test(text)) return "已完成";
  if (/(进行中|开始|推进|处理中)/.test(text)) return "进行中";
  return "待处理";
}

function aiDraftFromText(text) {
  const normalized = normalizeText(text);
  const owner = extractOwner(normalized);
  const deadline = extractDeadline(normalized);
  const priority = detectPriority(normalized);
  const status = detectStatus(normalized);
  const isProject = /(项目|上线|改版|方案|系统|平台|官网)/.test(normalized);
  const projectName =
    normalized
      .replace(/负责人[：:\s]*([^\s，。,]+)/g, "")
      .replace(/(20\d{2}-\d{2}-\d{2})/g, "")
      .replace(/(高优先级|低优先级|中优先级|紧急|马上|今天开始|本周内完成)/g, "")
      .trim() || "AI 新项目";

  return {
    kind: isProject ? "project" : "task",
    owner,
    deadline,
    priority,
    status,
    title: isProject
      ? projectName.replace(/^(建一个|创建|新增|做一个|帮我建一个)/, "").trim()
      : normalized.replace(/^(新增任务|添加任务|任务：|任务)/, "").trim(),
    summary: normalized
  };
}

function detectAiIntent(text) {
  if (/(目前完成了什么|现在做到哪|项目进度|进展如何|完成了什么)/.test(text)) return "progress";
  if (/(下一步|接下来做什么|还要做什么)/.test(text)) return "next";
  if (/(记一下进度|更新进度|刚完成|已经完成|完成了|新增进展|同步一下)/.test(text)) return "update";
  return "capture";
}

function findProjectByText(text) {
  const normalized = normalizeCompareText(text);
  let bestMatch = null;
  let bestLength = 0;

  state.projects.forEach((project) => {
    const projectName = normalizeCompareText(project.name);
    if (normalized.includes(projectName) && projectName.length > bestLength) {
      bestMatch = project;
      bestLength = projectName.length;
    }
  });

  return bestMatch;
}

function extractUpdateContent(text, projectName) {
  return text
    .replace(projectName, "")
    .replace(/(帮我|请|麻烦)/g, "")
    .replace(/(记一下进度|更新进度|同步一下|记录一下|新增进展)/g, "")
    .trim();
}

function addProjectUpdate(project, content) {
  ensureProjectShape(project);
  project.updates.unshift({
    id: crypto.randomUUID(),
    createdAt: formatTimestamp(),
    content
  });
}

function renderProgressAnswer(project) {
  const progress = projectProgress(project);
  const done = completedTasks(project);
  const updates = latestUpdates(project);

  const doneItems = done.length
    ? done.map((task) => `<span>已完成任务：${task.title}</span>`).join("")
    : "<span>目前还没有被标记为已完成的任务。</span>";
  const updateItems = updates.length
    ? updates.map((update) => `<span>最近进展：${update.content}</span>`).join("")
    : "<span>还没有记录项目进展。</span>";

  setAiResult(`
    <div class="ai-result-card">
      <div class="ai-result-label">AI 项目解读</div>
      <div class="ai-result-title">${project.name} 当前完成度 ${progress}%</div>
      <div class="ai-result-copy">系统已经识别到项目，并自动汇总已完成事项和最近进展。</div>
      <div class="ai-result-list">${doneItems}${updateItems}</div>
    </div>
  `);
}

function renderNextAnswer(project) {
  const pending = pendingTasks(project).slice(0, 3);
  const items = pending.length
    ? pending
        .map((task) => `<span>下一步建议：${task.title}，负责人 ${task.assignee || project.owner}，当前状态 ${task.status}</span>`)
        .join("")
    : "<span>当前任务都已完成，可以继续补充下一阶段目标。</span>";

  setAiResult(`
    <div class="ai-result-card">
      <div class="ai-result-label">AI 下一步建议</div>
      <div class="ai-result-title">${project.name} 接下来建议推进这些事情</div>
      <div class="ai-result-copy">我结合项目里未完成的任务，整理成了适合手机快速查看的摘要。</div>
      <div class="ai-result-list">${items}</div>
    </div>
  `);
}

function fillProjectFormFromAi() {
  const text = aiInput.value.trim();
  if (!text) {
    setAiFeedback("先在上面的 AI 输入区说一句需求，我再帮你填到项目表单里。");
    return;
  }

  const draft = aiDraftFromText(text);
  projectNameInput.value = draft.title || "AI 新项目";
  projectOwnerInput.value = draft.owner;
  projectDeadlineInput.value = draft.deadline;
  projectSummaryInput.value = draft.summary;
  setAiFeedback("我已经把内容预填到项目表单里了，你可以直接补两下再保存。");
}

function addAiRecord() {
  const text = aiInput.value.trim();
  if (!text) {
    setAiFeedback("你可以直接说“某某项目目前完成了什么”或“某某项目刚完成首屏文案，帮我记一下进度”。");
    return;
  }

  const intent = detectAiIntent(text);
  const matchedProject = findProjectByText(text);

  if ((intent === "progress" || intent === "next" || intent === "update") && !matchedProject) {
    setAiResult("");
    setAiFeedback("我听出来你是在查项目或记进展，但还没准确匹配到项目名，可以把项目名说得更完整一点。");
    return;
  }

  if (intent === "progress" && matchedProject) {
    renderProgressAnswer(matchedProject);
    setAiFeedback(`已经识别到项目「${matchedProject.name}」，你还可以继续问“下一步做什么”。`);
    return;
  }

  if (intent === "next" && matchedProject) {
    renderNextAnswer(matchedProject);
    setAiFeedback(`已经根据「${matchedProject.name}」现有任务整理出下一步建议。`);
    return;
  }

  if (intent === "update" && matchedProject) {
    const content = extractUpdateContent(text, matchedProject.name) || text;
    addProjectUpdate(matchedProject, content);
    saveState();
    renderBoard();
    aiInput.value = "";
    setAiResult(`
      <div class="ai-result-card">
        <div class="ai-result-label">AI 已记录</div>
        <div class="ai-result-title">新进展已加入 ${matchedProject.name}</div>
        <div class="ai-result-copy">以后你拿起手机直接问一句“${matchedProject.name} 目前完成了什么”，系统就会把这条进展一起纳入回答。</div>
        <div class="ai-result-list"><span>${content}</span></div>
      </div>
    `);
    setAiFeedback(`我已经把这条进展自动归档到「${matchedProject.name}」里了。`);
    return;
  }

  const draft = aiDraftFromText(text);

  if (draft.kind === "project" || !state.projects.length) {
    state.projects.unshift({
      id: crypto.randomUUID(),
      name: draft.title || "AI 新项目",
      owner: draft.owner,
      deadline: draft.deadline,
      summary: draft.summary,
      updates: [
        {
          id: crypto.randomUUID(),
          createdAt: formatTimestamp(),
          content: "项目已通过 AI 快速入口创建，可以继续直接用自然语言补充任务和进展。"
        }
      ],
      tasks: []
    });

    saveState();
    renderBoard();
    aiInput.value = "";
    setAiResult("");
    setAiFeedback(`AI 已帮你新建项目「${draft.title || "AI 新项目"}」，后面可以直接一句话问进度或加进展。`);
    return;
  }

  const project = state.projects[0];
  project.tasks.unshift({
    id: crypto.randomUUID(),
    title: draft.title || "AI 新任务",
    assignee: draft.owner,
    priority: draft.priority,
    status: draft.status,
    note: draft.summary
  });

  saveState();
  renderBoard();
  aiInput.value = "";
  setAiResult("");
  setAiFeedback(`AI 已把这条内容加入「${project.name}」作为任务，适合手机上快速连续记录。`);
}

projectForm.addEventListener("submit", addProject);
taskForm.addEventListener("submit", addTask);
searchInput.addEventListener("input", renderBoard);
ownerFilter.addEventListener("change", renderBoard);
statusFilter.addEventListener("change", renderBoard);
resetDataButton.addEventListener("click", resetSeedData);
aiCreateButton.addEventListener("click", addAiRecord);
aiFillProjectButton.addEventListener("click", fillProjectFormFromAi);

quickChips.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  aiInput.value = target.dataset.prompt || "";
  setAiFeedback("示例指令已填入，你可以直接执行，也可以先改一下再提交。");
});

renderBoard();
