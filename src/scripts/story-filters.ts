import { normalizeSearch } from '../search';

export function initStoryFilters(prefix: string) {
  const root = document.querySelector<HTMLElement>(`[data-story-browser="${prefix}"]`);
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('input[type="search"]')!;
  const count = root.querySelector<HTMLElement>('[data-result-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty-results]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-reset-filters]')!;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-search-text]')];
  const filters = [...root.querySelectorAll<HTMLButtonElement>('button[data-room]')];
  let category = '';
  const initial = new URLSearchParams(location.search);
  input.value = initial.get('q') ?? '';
  if (filters.some((filter) => filter.dataset.room === initial.get('room'))) {
    category = initial.get('room')!;
  }

  function update(syncUrl = true) {
    const terms = normalizeSearch(input.value).split(' ').filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const show = (!category || card.dataset.room === category)
        && terms.every((term) => card.dataset.searchText!.includes(term));
      card.hidden = !show;
      if (show) visible++;
    }
    for (const filter of filters) {
      const selected = filter.dataset.room === category;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    }
    const filtered = Boolean(input.value.trim() || category);
    count.textContent = `${visible} ${visible === 1 ? 'story' : 'stories'}${filtered ? ` of ${cards.length}` : ''}`;
    empty.hidden = visible > 0;
    reset.disabled = !filtered;
    if (syncUrl) {
      const url = new URL(location.href);
      if (input.value.trim()) url.searchParams.set('q', input.value.trim());
      else url.searchParams.delete('q');
      if (category) url.searchParams.set('room', category);
      else url.searchParams.delete('room');
      history.replaceState(null, '', url);
    }
  }

  input.addEventListener('input', () => update());
  filters.forEach((filter) => filter.addEventListener('click', () => {
    category = filter.dataset.room ?? '';
    update();
  }));
  reset.addEventListener('click', () => {
    input.value = '';
    category = '';
    update();
    input.focus();
  });
  update(false);
}
