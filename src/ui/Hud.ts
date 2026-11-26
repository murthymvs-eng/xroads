export class Hud {
  private el: HTMLElement;
  private moneyEl: HTMLElement | null;
  private loading: HTMLElement | null;
  private over: HTMLElement | null;
  private goScore: HTMLElement | null;
  private goBest: HTMLElement | null;
  private btn: HTMLButtonElement | null;
  private cs: HTMLElement | null;
  private csMoney: HTMLElement | null;
  private csRoster: HTMLElement | null;
  private csPlay: HTMLButtonElement | null;
  private selectedId: string | null = null;

  constructor() {
    this.el = document.getElementById('hud')!;
    this.moneyEl = document.getElementById('money');
    this.loading = document.getElementById('loading');
    this.over = document.getElementById('gameover');
    this.goScore = document.getElementById('go-score');
    this.goBest = document.getElementById('go-best');
    this.btn = document.getElementById('restart') as HTMLButtonElement | null;
    this.cs = document.getElementById('character-select');
    this.csMoney = document.getElementById('cs-money');
    this.csRoster = document.getElementById('cs-roster');
    this.csPlay = document.getElementById('cs-play') as HTMLButtonElement | null;
  }

  setDistance(d: number): void {
    this.el.textContent = 'DISTANCE ' + d;
  }

  setMoney(m: number): void {
    if (this.moneyEl) this.moneyEl.textContent = '💰 ' + m;
    if (this.csMoney) this.csMoney.textContent = '💰 ' + m;
  }

  showLoading(text = 'Loading…'): void {
    if (this.loading) this.loading.textContent = text;
  }

  hideLoading(): void {
    if (this.loading) this.loading.style.display = 'none';
  }

  showGameOver(score: number, best: number): void {
    if (this.goScore) this.goScore.textContent = 'Distance: ' + score;
    if (this.goBest) this.goBest.textContent = 'Best: ' + best;
    if (this.over) this.over.style.display = 'flex';
    if (this.btn) this.btn.style.display = 'inline-block';
    if (this.cs) this.cs.style.display = 'none';
  }

  clearGameOver(): void {
    if (this.over) this.over.style.display = 'none';
    if (this.btn) this.btn.style.display = 'none';
  }

  showMenu(): void {
    /* Menu screen lands in M8 */
  }

  showCharacterSelect(
    characters: { id: string; name: string; texture: string; cost: number }[],
    unlocked: Set<string>,
    money: number,
    onSelect: (id: string) => void,
    onUnlock: (id: string) => void,
    onPlay: () => void,
  ): void {
    if (!this.csRoster || !this.csPlay || !this.csMoney) return;
    this.csMoney.textContent = '💰 ' + money;
    this.csRoster.innerHTML = '';
    this.selectedId = null;

    for (const c of characters) {
      const isUnlocked = unlocked.has(c.id);
      const card = document.createElement('div');
      card.className = 'char-card' + (isUnlocked ? '' : ' locked');
      card.tabIndex = 0;
      card.role = 'button';

      const img = document.createElement('img');
      img.className = 'char-img';
      img.src = c.texture;
      img.alt = c.name;

      const name = document.createElement('div');
      name.className = 'char-name';
      name.textContent = c.name;

      const cost = document.createElement('div');
      cost.className = 'char-cost' + (isUnlocked ? '' : ' locked');
      cost.textContent = isUnlocked ? 'OWNED' : c.cost + ' coins';

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(cost);

      const select = () => {
        this.selectedId = c.id;
        document.querySelectorAll('#cs-roster .char-card').forEach((el) => {
          el.classList.remove('selected');
        });
        card.classList.add('selected');
        this.csPlay!.disabled = false;
      };

      card.addEventListener('click', () => {
        if (isUnlocked) {
          select();
        } else {
          onUnlock(c.id);
          this.render(characters, unlocked, money, onSelect, onUnlock, onPlay);
          if (unlocked.has(c.id)) select();
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      this.csRoster.appendChild(card);
    }

    if (this.cs) this.cs.style.display = 'flex';
    this.csPlay.disabled = true;

    this.csPlay.onclick = () => {
      if (this.selectedId) onSelect(this.selectedId);
      else onPlay();
    };
  }

  private render(
    characters: { id: string; name: string; texture: string; cost: number }[],
    unlocked: Set<string>,
    money: number,
    onSelect: (id: string) => void,
    onUnlock: (id: string) => void,
    onPlay: () => void,
  ): void {
    this.showCharacterSelect(characters, unlocked, money, onSelect, onUnlock, onPlay);
  }

  hideCharacterSelect(): void {
    if (this.cs) this.cs.style.display = 'none';
  }
}