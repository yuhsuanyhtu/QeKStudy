import { createFamilyDomain } from './src/family-domain.js';

const domain = createFamilyDomain();
let actorParentId = 'parent-a';
let selectedFamilyId = null;

const labels = { 'parent-a': '家長 A', 'parent-b': '家長 B' };
const familyForm = document.querySelector('#family-form');
const childForm = document.querySelector('#child-form');
const familyList = document.querySelector('#family-list');
const familyDetail = document.querySelector('#family-detail');
const studentList = document.querySelector('#student-list');
const status = document.querySelector('#status');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function renderFamilies() {
  const families = domain.listVisibleFamilies({ actorParentId });
  document.querySelector('#current-parent').textContent = labels[actorParentId];
  document.querySelector('#family-count').textContent = `${families.length} 個家庭`;
  familyList.replaceChildren();

  if (!families.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = '目前沒有家庭。建立一個家庭開始。';
    familyList.append(empty);
    selectedFamilyId = null;
    renderSelectedFamily();
    return;
  }

  if (!families.some((family) => family.familyId === selectedFamilyId)) {
    selectedFamilyId = families[0].familyId;
  }

  for (const family of families) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `family-card${family.familyId === selectedFamilyId ? ' selected' : ''}`;
    button.innerHTML = `<strong>${family.displayName}</strong><span>${family.familyId}</span>`;
    button.addEventListener('click', () => {
      selectedFamilyId = family.familyId;
      renderFamilies();
    });
    familyList.append(button);
  }

  renderSelectedFamily();
}

function renderSelectedFamily() {
  if (!selectedFamilyId) {
    familyDetail.classList.add('hidden');
    return;
  }

  try {
    const family = domain.readFamilyPrivateData({ actorParentId, familyId: selectedFamilyId });
    familyDetail.classList.remove('hidden');
    document.querySelector('#selected-family-name').textContent = family.displayName;
    studentList.replaceChildren();

    if (!family.students.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '這個家庭還沒有孩子。';
      studentList.append(empty);
      return;
    }

    for (const student of family.students) {
      const row = document.createElement('div');
      row.className = 'student-row';
      row.innerHTML = `<span>${student.displayName}</span><small>${student.studentId}</small>`;
      studentList.append(row);
    }
  } catch {
    selectedFamilyId = null;
    familyDetail.classList.add('hidden');
  }
}

familyForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#family-name');
  try {
    const { familyId } = domain.createFamily({ actorParentId, displayName: input.value });
    selectedFamilyId = familyId;
    input.value = '';
    setStatus('家庭已建立。');
    renderFamilies();
  } catch (error) {
    setStatus(error.code === 'EMPTY_FAMILY_NAME' ? '請輸入家庭名稱。' : '無法建立家庭。', true);
  }
});

childForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#child-name');
  try {
    domain.addChildToFamily({ actorParentId, familyId: selectedFamilyId, childDisplayName: input.value });
    input.value = '';
    setStatus('孩子已加入目前家庭。');
    renderSelectedFamily();
  } catch (error) {
    const message = error.code === 'EMPTY_CHILD_NAME' ? '請輸入孩子名稱。' : '你沒有權限操作這個家庭。';
    setStatus(message, true);
  }
});

document.querySelectorAll('[data-parent]').forEach((button) => {
  button.addEventListener('click', () => {
    actorParentId = button.dataset.parent;
    selectedFamilyId = null;
    document.querySelectorAll('[data-parent]').forEach((item) => item.classList.toggle('active', item === button));
    setStatus(`已切換為 ${labels[actorParentId]}。`);
    renderFamilies();
  });
});

renderFamilies();
