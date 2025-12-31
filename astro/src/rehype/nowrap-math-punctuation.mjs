// Rehype plugin: prevent "orphan punctuation" right after inline KaTeX.
//
// Problem:
// - KaTeX renders inline math as an element (<span class="katex">…</span>).
// - Browsers may line-break between that element and the next text node, which can
//   leave punctuation (",", ".", etc.) dangling at the start of the next line.
//
// Fix:
// - When we find: [inline-katex-element][text node starting with punctuation]
//   we wrap the KaTeX element + the first punctuation character into:
//     <span class="nowrap">[katex][punct]</span>
// - CSS (already in global.css): `.prose .nowrap { white-space: nowrap; }`
//
// Notes:
// - We only target inline KaTeX (`.katex`) and explicitly ignore display math
//   (`.katex-display`).

function isElement(node) {
  return node && node.type === "element";
}

function isRaw(node) {
  return node && node.type === "raw" && typeof node.value === "string";
}

function isNoWrapContainer(node) {
  if (!isElement(node)) return false;
  const cls = classList(node);
  return cls.includes("nowrap");
}

function classList(node) {
  const cn = node?.properties?.className;
  if (!cn) return [];
  return Array.isArray(cn) ? cn : [cn];
}

function isInlineKatex(node) {
  if (!isElement(node)) return false;
  const cls = classList(node);
  return cls.includes("katex") && !cls.includes("katex-display");
}

function isInlineKatexRaw(node) {
  if (!isRaw(node)) return false;
  // rehype-katex sometimes emits raw HTML; catch inline KaTeX but not display KaTeX.
  return node.value.includes('class="katex"') && !node.value.includes("katex-display");
}

function isText(node) {
  return node && node.type === "text" && typeof node.value === "string";
}

function isWhitespaceOnlyText(node) {
  return isText(node) && /^[\t \n\r\u00A0]*$/.test(node.value);
}

// Allow optional leading whitespace (incl. NBSP) before punctuation, because
// markdown/typography can sometimes emit a text node like "\u00A0,".
// Also include closing brackets/parentheses as common "orphan" characters.
const LEADING_WS_AND_PUNCT_RE = /^([\t \n\r\u00A0]*)([,.;:!?\)\]\}])/;

export default function rehypeNoWrapMathPunctuation() {
  return (tree) => {
    /** @type {any[]} */
    const stack = [tree];

    while (stack.length) {
      const node = stack.pop();
      if (!node || !node.children || !Array.isArray(node.children)) continue;
      // Critical: do NOT process inside an existing nowrap wrapper, otherwise we will
      // keep wrapping the same KaTeX+punct over and over (infinite nesting → OOM).
      if (isNoWrapContainer(node)) continue;

      const { children } = node;
      for (let i = 0; i < children.length - 1; i++) {
        const cur = children[i];
        const isMath = isInlineKatex(cur) || isInlineKatexRaw(cur);
        if (!isMath) continue;

        // Skip over whitespace-only nodes between math and punctuation (common with NBSP).
        let j = i + 1;
        let interWs = "";
        while (j < children.length && isWhitespaceOnlyText(children[j])) {
          interWs += children[j].value;
          j++;
        }
        const next = children[j];

        if (!isText(next)) continue;
        const m = next.value.match(LEADING_WS_AND_PUNCT_RE);
        if (!m) continue;

        const lead = m[1] ?? "";
        const punct = m[2];
        const rest = next.value.slice((lead + punct).length);

        const wrapper = {
          type: "element",
          tagName: "span",
          properties: { className: ["nowrap"] },
          children: [cur, { type: "text", value: interWs + lead + punct }],
        };

        // Replace cur with wrapper, and update/remove next text node.
        children[i] = wrapper;
        // Remove any whitespace-only nodes we skipped over.
        if (j > i + 1) {
          children.splice(i + 1, j - (i + 1));
          // After splice, `next` is now at i+1.
        }
        const nextAfter = children[i + 1];
        if (nextAfter && isText(nextAfter)) {
          if (rest.length === 0) {
            children.splice(i + 1, 1);
          } else {
            nextAfter.value = rest;
          }
        } else {
          // Should not happen, but keep safe.
        }
      }

      // Continue traversal
      for (const child of children) stack.push(child);
    }
  };
}


