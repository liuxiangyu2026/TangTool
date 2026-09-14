export function searchTools<T extends { label: string; description: string; keywords: string }>(items: T[], query: string): T[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items
    .map((item) => {
      const name = item.label.toLocaleLowerCase();
      const fields = [name, item.keywords.toLocaleLowerCase(), item.description.toLocaleLowerCase()];
      let score = 0;
      for (const term of terms) {
        if (name.includes(term)) continue;
        if (fields.some((field) => field.includes(term))) {
          score += 1;
          continue;
        }
        // 非连续字符也能命中，例如 xl → Excel；不依赖网络搜索或历史记录。
        const fuzzy = fields.some((field) => {
          let offset = 0;
          for (const character of term) {
            const index = field.indexOf(character, offset);
            if (index < 0) return false;
            offset = index + character.length;
          }
          return true;
        });
        if (!fuzzy) return { item, score: Infinity };
        score += 3;
      }
      return { item, score };
    })
    .filter((match) => Number.isFinite(match.score))
    .sort((a, b) => a.score - b.score)
    .map((match) => match.item);
}
