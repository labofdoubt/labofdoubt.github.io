// Rehype plugin: turn plain-text URLs in the generated bibliography (#refs) into <a href="..."> links.
// This is intentionally scoped to the bibliography container so we don't linkify the entire post body.

function isElement(node) {
  return node && typeof node === "object" && node.type === "element";
}

function isText(node) {
  return node && typeof node === "object" && node.type === "text";
}

function visit(node, fn) {
  fn(node);
  if (node && node.children && Array.isArray(node.children)) {
    for (const child of node.children) visit(child, fn);
  }
}

function splitUrls(text) {
  // Capture URLs but stop before whitespace or a trailing ')' or '.' or ',' commonly used in prose.
  const re = /(https?:\/\/[^\s)]+)([).,]?)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "url", value: m[1] });
    if (m[2]) parts.push({ type: "text", value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function linkifyTextNode(parent, idx, textNode) {
  const parts = splitUrls(textNode.value);
  if (!parts.some((p) => p.type === "url")) return;

  const newNodes = parts.map((p) => {
    if (p.type === "url") {
      return {
        type: "element",
        tagName: "a",
        properties: {
          href: p.value,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        children: [{ type: "text", value: p.value }],
      };
    }
    return { type: "text", value: p.value };
  });

  parent.children.splice(idx, 1, ...newNodes);
}

export default function rehypeLinkifyBibliographyUrls() {
  return function transformer(tree) {
    // Find the bibliography container
    let refsNode = null;
    visit(tree, (node) => {
      if (refsNode) return;
      if (isElement(node) && node.properties && node.properties.id === "refs") {
        refsNode = node;
      }
    });

    if (!refsNode) return;

    // Walk within #refs and linkify text nodes (skip existing links)
    const stack = [{ node: refsNode, parent: null }];
    while (stack.length) {
      const { node } = stack.pop();
      if (!node.children) continue;

      // Iterate with index because we mutate
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isElement(child) && child.tagName === "a") continue;
        if (isText(child)) {
          linkifyTextNode(node, i, child);
          // If we replaced the node with multiple nodes, advance accordingly
          // (safe because linkifyTextNode splices at i)
        } else if (isElement(child)) {
          stack.push({ node: child, parent: node });
        }
      }
    }
  };
}


