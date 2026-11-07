import {QUESTIONS, SECTION_LABELS, NEUTRAL_QUESTION_IDS, SURVEY_VERSION, SCHEMA_VERSION,
  getPath, getEligibility, resolveQuestion, selectAnswer, cleanAnswers,
  questionFingerprint, validateSubmission} from './survey-core.mjs';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE_KEY = `xindong:${SURVEY_VERSION}:draft`;
const views = ['home','survey','review','done','ineligible'];
const blankState = () => ({version:SURVEY_VERSION,answers:{},skipped:[],neutralQuestions:[],currentId:'D01',started:false,startedAt:null,submissionId:null,pending:null,receipt:null});
let state = loadDraft();
let editing = false;
let submitting = false;
let currentView = 'home';
let toastTimer;

function loadDraft() {
  const fallback = blankState();
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (!saved || saved.version !== SURVEY_VERSION) return fallback;
    const next = {...fallback,...saved};
    next.neutralQuestions = Array.isArray(next.neutralQuestions) ? next.neutralQuestions.filter(id => NEUTRAL_QUESTION_IDS.includes(id)) : [];
    next.answers = cleanAnswers(next.answers,next.neutralQuestions);
    const path = getPath(next.answers);
    next.skipped = Array.isArray(next.skipped) ? [...new Set(next.skipped)].filter(id => path.includes(id) && !next.answers[id]) : [];
    next.neutralQuestions = next.neutralQuestions.filter(id => path.includes(id));
    next.currentId = path.includes(next.currentId) ? next.currentId : path[0];
    next.pending = next.pending && validateSubmission(next.pending).ok ? next.pending : null;
    next.receipt = typeof next.receipt === 'string' ? next.receipt.slice(0,120) : null;
    next.startedAt = Number.isFinite(next.startedAt) ? next.startedAt : Date.now();
    return next;
  } catch { return fallback; }
}
function saveDraft() {
  try { sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { /* The in-memory answer remains available. */ }
}
function toast(message) {
  $('global-message').textContent = message;
  $('global-message').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('global-message').hidden = true; },3600);
}
function show(view) {
  currentView = view;
  for (const id of views) $(id).hidden = id !== view;
  if (view === 'home') {
    $('start').innerHTML = `${state.receipt ? '已完成作答' : state.pending ? '继续提交' : state.started ? '继续作答' : '开始作答'} <span aria-hidden="true">↗</span>`;
    $('clear-draft').hidden = !state.started || !!state.receipt || !!state.pending;
  }
  window.scrollTo({top:0,behavior:'instant'});
}
function fingerprints() {
  return Object.fromEntries(Object.keys(QUESTIONS).map(id => [id,questionFingerprint(id,state.answers,state.neutralQuestions)]));
}
function reconcile(before) {
  for (const id of Object.keys(QUESTIONS)) {
    if (before[id] !== questionFingerprint(id,state.answers,state.neutralQuestions)) {
      delete state.answers[id];
      state.skipped = state.skipped.filter(value => value !== id);
    }
  }
  state.answers = cleanAnswers(state.answers,state.neutralQuestions);
  const path = getPath(state.answers);
  state.neutralQuestions = state.neutralQuestions.filter(id => path.includes(id));
  state.skipped = state.skipped.filter(id => path.includes(id) && !state.answers[id]);
  if (!path.includes(state.currentId)) state.currentId = path[0];
  saveDraft();
}
function currentQuestion() { return resolveQuestion(state.currentId,state.answers,state.neutralQuestions); }
function isAnswered(q) { return !!state.answers[q.id]?.values?.length; }
function syncControls() {
  const q = currentQuestion();
  const path = getPath(state.answers);
  $('previous').disabled = path.indexOf(q.id) <= 0;
  $('next').disabled = !isAnswered(q);
  const atEnd = path.indexOf(q.id) === path.length - 1;
  $('next').innerHTML = `${getEligibility(state.answers) === 'not_enrolled' ? '结束问卷' : editing ? '返回检查' : atEnd ? '检查回答' : '下一步'} <span aria-hidden="true">→</span>`;
}
function optionMarkup(q, option) {
  const selected = state.answers[q.id]?.values?.includes(option.value);
  const special = option.exclusive || ['declined','unsure','not_applicable','cannot_imagine','not_experienced'].includes(option.status);
  return `<label class="option${selected ? ' selected' : ''}${special ? ' special' : ''}"><input type="${q.type === 'multi' ? 'checkbox' : 'radio'}" name="answer-${q.id}" value="${esc(option.value)}"${selected ? ' checked' : ''}><span class="option-marker" aria-hidden="true"></span><span class="option-label">${esc(option.label)}</span></label>`;
}
function syncSelection(q) {
  const selected = state.answers[q.id]?.values || [];
  $('question-panel').querySelectorAll('input[name^="answer-"]').forEach(input => {
    input.checked = selected.includes(input.value);
    input.closest('.option').classList.toggle('selected',input.checked);
  });
  if (q.type === 'text') {
    const writing = selected.includes('write');
    $('text-entry').hidden = !writing;
    if (!writing) { $('response').value = ''; $('char-count').textContent = '0'; }
  }
  syncControls();
}
function renderQuestion() {
  if (state.pending) return renderReview();
  if (!getPath(state.answers).includes(state.currentId)) state.currentId = getPath(state.answers)[0];
  show('survey');
  const q = currentQuestion();
  const path = getPath(state.answers);
  const position = path.indexOf(q.id);
  const progress = Math.round(position / path.length * 100);
  $('section-name').textContent = SECTION_LABELS[q.section-1];
  $('progress-bar').style.width = `${progress}%`;
  $('progress-track').setAttribute('aria-valuenow',progress);
  $('section-list').innerHTML = SECTION_LABELS.map((label,i) => `<li${i+1 === q.section ? ' class="current" aria-current="step"' : i+1 < q.section ? ' class="complete"' : ''}><span>${String(i+1).padStart(2,'0')}</span>${esc(label)}</li>`).join('');
  const gender = state.answers.D01?.values?.[0];
  const canNeutral = NEUTRAL_QUESTION_IDS.includes(q.id) && ['female','male'].includes(gender);
  const isNeutral = state.neutralQuestions.includes(q.id);
  const special = option => option.exclusive || ['declined','unsure','not_applicable','cannot_imagine','not_experienced'].includes(option.status);
  const ordinaryOptions = q.options.filter(option => !special(option));
  const extraOptions = q.options.filter(special);
  const type = q.type === 'multi' ? '最多选两项' : q.type === 'text' ? '选填' : q.section === 4 ? '假设情景 · 单选' : '单选';
  $('question-panel').innerHTML = `<div class="question-heading"><span class="question-kind">${type}</span>${canNeutral ? `<button id="neutral-toggle" class="text-button neutral-toggle" aria-pressed="${isNeutral}">${isNeutral ? '使用默认情景' : '使用通用情景'}</button>` : ''}</div><h1 id="question-title" class="question-title" tabindex="-1">${esc(q.title)}</h1>${q.hint ? `<p class="question-hint" id="question-hint">${esc(q.hint)}</p>` : ''}<div class="options ${q.type === 'multi' ? 'multiple' : ''}" role="group" aria-labelledby="question-title">${ordinaryOptions.map(option => optionMarkup(q,option)).join('')}</div>${extraOptions.length ? `<div class="special-options ${q.type === 'multi' ? 'multiple' : ''}" role="group" aria-label="其他作答选项">${extraOptions.map(option => optionMarkup(q,option)).join('')}</div>` : ''}${q.type === 'text' ? `<div id="text-entry"${state.answers[q.id]?.values?.includes('write') ? '' : ' hidden'}><textarea id="response" class="response-text" maxlength="150" aria-label="补充想法" placeholder="写下一句话就好。请勿填写姓名或联系方式。">${esc(state.answers[q.id]?.text || '')}</textarea><p class="text-count"><span id="char-count">${(state.answers[q.id]?.text || '').length}</span> / 150 字</p></div>` : ''}<p id="feedback" class="feedback" role="status" aria-live="polite"></p>`;
  $('question-panel').querySelectorAll('input[name^="answer-"]').forEach(input => input.addEventListener('change',() => {
    const before = fingerprints();
    const oldAnswer = state.answers[q.id];
    const result = selectAnswer(q,oldAnswer?.values || [],input.value);
    if (result.limit) {
      $('feedback').textContent = '最多选两项，可以先取消一项。';
      syncSelection(q); return;
    }
    if (result.values.length) {
      state.answers[q.id] = {values:result.values};
      if (q.type === 'text' && result.values.includes('write')) state.answers[q.id].text = oldAnswer?.text || '';
    } else delete state.answers[q.id];
    state.skipped = state.skipped.filter(id => id !== q.id);
    reconcile(before);
    $('feedback').textContent = '';
    syncSelection(q);
    if (q.type === 'text' && result.values.includes('write')) $('response').focus();
  }));
  if (canNeutral) $('neutral-toggle').addEventListener('click',() => {
    const before = fingerprints();
    state.neutralQuestions = isNeutral ? state.neutralQuestions.filter(id => id !== q.id) : [...state.neutralQuestions,q.id];
    reconcile(before); renderQuestion();
  });
  if (q.type === 'text') $('response').addEventListener('input',event => {
    state.answers[q.id] = {values:['write'],text:event.target.value};
    state.skipped = state.skipped.filter(id => id !== q.id);
    $('char-count').textContent = event.target.value.length;
    saveDraft(); syncControls();
  });
  syncControls();
  $('question-title').focus({preventScroll:true});
}
function advance() {
  if (getEligibility(state.answers) === 'not_enrolled') {
    show('ineligible'); $('ineligible').querySelector('h1').focus({preventScroll:true}); return;
  }
  const path = getPath(state.answers);
  const position = path.indexOf(state.currentId);
  if (editing || position >= path.length - 1) return renderReview();
  state.currentId = path[position+1]; saveDraft(); renderQuestion();
}
function answerText(q) {
  if (state.skipped.includes(q.id)) return '已跳过';
  const answer = state.answers[q.id];
  if (!answer?.values?.length) return '暂未回答';
  if (q.type === 'text' && answer.values.includes('write')) return answer.text?.trim() || '未填写补充内容';
  return answer.values.map(value => q.options.find(o => o.value === value)?.label || '').join('；');
}
function renderReview(error = '') {
  editing = false;
  show('review');
  const locked = !!state.pending;
  $('review').innerHTML = `<span class="eyebrow">最后，再看一眼</span><h1 tabindex="-1">这些，就是此刻的想法。</h1><p class="review-intro">${locked ? '提交状态尚未确认，请重试提交。同一份回答不会重复记录。' : '可以修改，也可以保留空白。确认后，你的回答将匿名提交。'}</p>${getPath(state.answers).map(id => { const q = resolveQuestion(id,state.answers,state.neutralQuestions); return `<div class="answer-row"><div><h3>${esc(q.title)}</h3><p>${esc(answerText(q))}</p></div>${locked ? '' : `<button class="text-button edit-answer" data-id="${id}" aria-label="修改：${esc(q.title)}">修改 ↗</button>`}</div>`; }).join('')}<div class="review-actions">${locked ? '<span></span>' : '<button class="text-button" id="review-back">← 返回作答</button>'}<button class="primary" id="submit">${locked ? '重试提交' : '匿名提交'} <span aria-hidden="true">↗</span></button></div><p class="submit-note">回答仅向授权研究者开放，不会在填写页面公开展示。</p><div class="submit-error" id="submit-error" role="alert"${error ? '' : ' hidden'}>${esc(error)}</div>`;
  $('review').querySelectorAll('.edit-answer').forEach(button => button.addEventListener('click',() => {
    state.currentId = button.dataset.id; editing = true; saveDraft(); renderQuestion();
  }));
  if (!locked) $('review-back').addEventListener('click',() => { state.currentId = getPath(state.answers).at(-1); renderQuestion(); });
  $('submit').addEventListener('click',submit);
  $('review').querySelector('h1').focus({preventScroll:true});
}
function newSubmissionId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes,b => b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
async function submit() {
  if (submitting) return;
  if (!state.pending) {
    state.answers = cleanAnswers(state.answers,state.neutralQuestions);
    state.submissionId ||= newSubmissionId();
    const payload = {schemaVersion:SCHEMA_VERSION,surveyVersion:SURVEY_VERSION,submissionId:state.submissionId,consent:true,answers:state.answers,skipped:state.skipped,neutralQuestions:state.neutralQuestions,durationSeconds:Math.max(0,Math.min(86400,Math.round((Date.now() - (state.startedAt || Date.now()))/1000)))};
    if (!validateSubmission(payload).ok) {
      return renderReview('有一处回答需要重新确认，请检查后再提交。');
    }
    state.pending = structuredClone(payload);
    saveDraft();
  }
  submitting = true;
  $('submit').disabled = true; $('submit').textContent = '正在提交…';
  $('submit-error').hidden = true;
  // Freeze edits while an accepted-but-unacknowledged request may exist.
  $('review').querySelectorAll('.edit-answer,#review-back').forEach(button => { button.disabled = true; });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),20000);
  try {
    const response = await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state.pending),signal:controller.signal,credentials:'same-origin'});
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 400 || response.status === 422) {
        state.pending = null; saveDraft();
        renderReview('有一处回答未能通过检查，请重新确认后提交。');
      } else if (response.status === 409) {
        renderReview('这份提交的内容与已保存版本不一致。为避免重复记录，请保留此页面并联系调查组织者。');
      } else renderReview(response.status === 429 ? '提交较频繁，请稍后重试。回答已保留。' : '暂时未能完成提交。回答已保留，请稍后重试。');
      return;
    }
    if (typeof result.receipt !== 'string' || !result.receipt) throw new Error('missing_receipt');
    state = {...blankState(),receipt:result.receipt.slice(0,120)};
    saveDraft(); renderDone();
  } catch {
    renderReview('网络暂时没有回应。回答已保留，请重试提交，系统会避免重复记录。');
  } finally { clearTimeout(timeout); submitting = false; }
}
function renderDone() {
  show('done');
  $('done').innerHTML = `<div class="done-mark" aria-hidden="true">♡</div><span class="eyebrow">谢谢你的认真分享</span><h1 tabindex="-1">让真实的想法，被听见。</h1><p>你的回答已成功提交。<br>愿你拥有自在的关系，也拥有自在的自己。</p><p class="receipt">提交凭证：${esc(state.receipt)}</p>`;
  $('done').querySelector('.eyebrow').style.justifyContent = 'center';
  $('done').querySelector('h1').focus({preventScroll:true});
}

$('start').addEventListener('click',() => {
  if (state.receipt) return renderDone();
  if (state.pending) return renderReview();
  state.started = true; state.startedAt ||= Date.now(); saveDraft(); renderQuestion();
});
$('clear-draft').addEventListener('click',() => {
  if (confirm('清除当前尚未提交的回答，重新开始吗？')) { state = blankState(); saveDraft(); show('home'); }
});
$('next').addEventListener('click',() => { if (isAnswered(currentQuestion())) advance(); });
$('skip').addEventListener('click',() => {
  const id = state.currentId; const before = fingerprints();
  delete state.answers[id];
  if (!state.skipped.includes(id)) state.skipped.push(id);
  reconcile(before); advance();
});
$('previous').addEventListener('click',() => {
  const path = getPath(state.answers); const index = path.indexOf(state.currentId);
  if (index > 0) { state.currentId = path[index-1]; saveDraft(); renderQuestion(); }
});
function goHome(event) {
  event?.preventDefault();
  if (submitting) return toast('正在提交，请稍候。');
  show('home');
}
$('back-home').addEventListener('click',goHome);
$('brand-link').addEventListener('click',goHome);
$('correct-study').addEventListener('click',() => { state.currentId = 'D02'; editing = false; renderQuestion(); });
$('exit-ineligible').addEventListener('click',() => { state = blankState(); saveDraft(); show('home'); });
document.querySelectorAll('[data-privacy]').forEach(button => button.addEventListener('click',() => $('privacy-dialog').showModal()));
$('close-privacy').addEventListener('click',() => $('privacy-dialog').close());
$('accept-privacy').addEventListener('click',() => $('privacy-dialog').close());
$('privacy-dialog').addEventListener('click',event => { if (event.target === $('privacy-dialog')) { const rect = $('privacy-dialog').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('privacy-dialog').close(); } });
if (state.receipt) renderDone(); else show('home');
