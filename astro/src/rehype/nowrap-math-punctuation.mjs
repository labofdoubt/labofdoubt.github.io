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

function isText(node) {
  return node && node.type === "text" && typeof node.value === "string";
}

const PUNCT_RE = /^[,.;:!?]/;

export default function rehypeNoWrapMathPunctuation() {
  return (tree) => {
    /** @type {any[]} */
    const stack = [tree];

    while (stack.length) {
      const node = stack.pop();
      if (!node || !node.children || !Array.isArray(node.children)) continue;

      const { children } = node;
      for (let i = 0; i < children.length - 1; i++) {
        const cur = children[i];
        const next = children[i + 1];

        if (!isInlineKatex(cur)) continue;
        if (!isText(next)) continue;
        if (!PUNCT_RE.test(next.value)) continue;

        const punct = next.value[0];
        const rest = next.value.slice(1);

        const wrapper = {
          type: "element",
          tagName: "span",
          properties: { className: ["nowrap"] },
          children: [cur, { type: "text", value: punct }],
        };

        // Replace cur with wrapper, and update/remove next text node.
        children[i] = wrapper;
        if (rest.length === 0) {
          children.splice(i + 1, 1);
        } else {
          next.value = rest;
        }
      }

      // Continue traversal
      for (const child of children) stack.push(child);
    }
  };
}


