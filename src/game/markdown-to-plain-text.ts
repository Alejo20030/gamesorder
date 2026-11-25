import { remark } from "remark";
import remarkGfm from "remark-gfm";

type MdNode = {
  type: string;
  value?: string;
  alt?: string | null;
  children?: MdNode[];
};

const LEAF_TEXT = new Set(["text", "inlineCode", "code"]);

function collect(node: MdNode, chunks: string[]) {
  if (LEAF_TEXT.has(node.type)) {
    if (node.value) chunks.push(node.value);
    chunks.push(" ");
    return;
  }

  if (node.type === "image" || node.type === "imageReference") {
    if (node.alt) chunks.push(node.alt);
    chunks.push(" ");
    return;
  }

  if (node.type === "html" && node.value) {
    chunks.push(node.value.replace(/<[^>]*>/g, " "));
    chunks.push(" ");
    return;
  }

  if (node.type === "break") {
    chunks.push(" ");
    return;
  }

  if (node.children) {
    for (const child of node.children) {
      collect(child, chunks);
    }
    chunks.push(" ");
  }
}

/** Visible text of a Markdown string. Keep in sync with the game template copy. */
export function markdownToPlainText(markdown: string): string {
  const tree = remark().use(remarkGfm).parse(markdown) as unknown as MdNode;
  const chunks: string[] = [];
  collect(tree, chunks);
  return chunks.join("").replace(/\s+/g, " ").trim();
}
