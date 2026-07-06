"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MathContentProps {
  children: string;
  /** block=true болса — параграфтар блок ретінде (сұрақ мәтіні үшін) */
  block?: boolean;
  className?: string;
}

/**
 * Markdown + LaTeX рендерлеуші.
 * Ішінде $...$ (inline) немесе $$...$$ (block) формулалары қолданылады.
 * Мыс: "Есептеңіз: $\\frac{1}{2} + \\frac{1}{3}$"
 */
export function MathContent({ children, block = false, className = "" }: MathContentProps) {
  return (
    <div className={`math-content ${block ? "block" : ""} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
