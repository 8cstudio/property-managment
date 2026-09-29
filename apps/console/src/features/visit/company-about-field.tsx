"use client";

import Highlight from "@tiptap/extension-highlight";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { type Editor, EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Table,
  Underline,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { safeHref } from "./about-html";

const FONTS = [
  "Arial",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Tahoma",
  "Trebuchet MS",
];

const SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "36"];

export function CompanyAboutField({
  invalid,
  onChange,
}: {
  invalid?: boolean;
  onChange: (html: string) => void;
}) {
  const tf = useTranslations("forms");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
      }),
      TextStyleKit.configure({
        lineHeight: false,
        backgroundColor: false,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: false } }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: tf("aboutCompanyHint"),
      }),
    ],
    editorProps: {
      attributes: {
        "aria-labelledby": "about-company-label",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(current.getHTML());
    },
  });

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          "aria-labelledby": "about-company-label",
          "aria-multiline": "true",
          role: "textbox",
          "aria-invalid": invalid ? "true" : "false",
        },
      },
    });
  }, [editor, invalid]);

  return (
    <div className="rich-field">
      <span id="about-company-label">{tf("aboutCompany")}</span>
      <div className={invalid ? "composer is-invalid" : "composer"}>
        {editor ? <ComposerBar editor={editor} /> : <div className="composer-bar" />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ComposerBar({ editor }: { editor: Editor }) {
  const tf = useTranslations("forms");
  const saved = useRef({ from: 1, to: 1 });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const style = current.getAttributes("textStyle");
      return {
        bold: current.isActive("bold"),
        italic: current.isActive("italic"),
        underline: current.isActive("underline"),
        bullet: current.isActive("bulletList"),
        ordered: current.isActive("orderedList"),
        link: current.isActive("link"),
        href: (current.getAttributes("link").href as string | undefined) ?? "",
        font: (style.fontFamily as string | undefined) ?? "",
        size: ((style.fontSize as string | undefined) ?? "").replace("px", ""),
        color: (style.color as string | undefined) ?? "#111827",
        highlight:
          (current.getAttributes("highlight").color as string | undefined) ??
          "#fff3a0",
        align: (["left", "center", "right", "justify"] as const).find((value) =>
          current.isActive({ textAlign: value }),
        ),
      };
    },
  });

  function remember() {
    const { from, to } = editor.state.selection;
    saved.current = { from, to };
  }

  function run(command: () => boolean) {
    const { from, to } = saved.current;
    editor.chain().focus().setTextSelection({ from, to }).run();
    command();
  }

  function applyLink() {
    const href = safeHref(linkDraft);
    if (!href) return;
    run(() => editor.chain().focus().extendMarkRange("link").setLink({ href }).run());
    setLinkOpen(false);
  }

  return (
    <div className="composer-bar" role="toolbar" aria-label={tf("aboutCompany")}>
      <div className="composer-bar__row">
        <ToolButton
          label={tf("aboutBold")}
          active={state.bold}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().toggleBold().run());
          }}
        >
          <Bold size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutItalic")}
          active={state.italic}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().toggleItalic().run());
          }}
        >
          <Italic size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutUnderline")}
          active={state.underline}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().toggleUnderline().run());
          }}
        >
          <Underline size={16} />
        </ToolButton>
        <span className="composer-sep" />
        <select
          aria-label={tf("aboutFont")}
          value={state.font}
          onMouseDown={remember}
          onChange={(event) => {
            const font = event.target.value;
            run(() =>
              font
                ? editor.chain().focus().setFontFamily(font).run()
                : editor.chain().focus().unsetFontFamily().run(),
            );
          }}
        >
          <option value="">{tf("aboutFont")}</option>
          {FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <select
          className="composer-size"
          aria-label={tf("aboutFontSize")}
          value={state.size}
          onMouseDown={remember}
          onChange={(event) => {
            const size = event.target.value;
            run(() =>
              size
                ? editor.chain().focus().setFontSize(`${size}px`).run()
                : editor.chain().focus().unsetFontSize().run(),
            );
          }}
        >
          <option value="">{tf("aboutFontSize")}</option>
          {SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <ColorSwatch
          label={tf("aboutTextColor")}
          kind="ink"
          value={state.color}
          onOpen={remember}
          onChange={(color) => run(() => editor.chain().focus().setColor(color).run())}
        />
        <ColorSwatch
          label={tf("aboutHighlight")}
          kind="mark"
          value={state.highlight}
          onOpen={remember}
          onChange={(color) =>
            run(() => editor.chain().focus().setHighlight({ color }).run())
          }
        />
      </div>
      <div className="composer-bar__row">
        <ToolButton
          label={tf("aboutAlignLeft")}
          active={state.align === "left"}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().setTextAlign("left").run());
          }}
        >
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutAlignCenter")}
          active={state.align === "center"}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().setTextAlign("center").run());
          }}
        >
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutAlignRight")}
          active={state.align === "right"}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().setTextAlign("right").run());
          }}
        >
          <AlignRight size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutAlignJustify")}
          active={state.align === "justify"}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().setTextAlign("justify").run());
          }}
        >
          <AlignJustify size={16} />
        </ToolButton>
        <span className="composer-sep" />
        <ToolButton
          label={tf("aboutLink")}
          active={state.link || linkOpen}
          onClick={() => {
            remember();
            setLinkDraft(state.href);
            setLinkOpen((open) => !open);
          }}
        >
          <Link2 size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutTable")}
          active={false}
          onClick={() => {
            remember();
            run(() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run(),
            );
          }}
        >
          <Table size={16} />
        </ToolButton>
        <span className="composer-sep" />
        <ToolButton
          label={tf("aboutList")}
          active={state.bullet}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().toggleBulletList().run());
          }}
        >
          <List size={16} />
        </ToolButton>
        <ToolButton
          label={tf("aboutOrderedList")}
          active={state.ordered}
          onClick={() => {
            remember();
            run(() => editor.chain().focus().toggleOrderedList().run());
          }}
        >
          <ListOrdered size={16} />
        </ToolButton>
      </div>
      {linkOpen ? (
        <div className="composer-link">
          <input
            type="url"
            value={linkDraft}
            placeholder="https://"
            aria-label={tf("aboutLink")}
            onChange={(event) => setLinkDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setLinkOpen(false);
            }}
          />
          <button type="button" onClick={applyLink}>
            {tf("aboutApplyLink")}
          </button>
          <button
            type="button"
            onClick={() => {
              run(() => editor.chain().focus().unsetLink().run());
              setLinkOpen(false);
            }}
          >
            {tf("aboutRemoveLink")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={active ? "is-active" : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  label,
  kind,
  value,
  onOpen,
  onChange,
}: {
  label: string;
  kind: "ink" | "mark";
  value: string;
  onOpen: () => void;
  onChange: (color: string) => void;
}) {
  const color = /^#[0-9a-f]{6}$/i.test(value) ? value : kind === "ink" ? "#111827" : "#fff3a0";
  return (
    <label className={kind === "ink" ? "composer-swatch" : "composer-swatch composer-swatch--mark"}>
      <span aria-hidden="true">A</span>
      <i style={{ background: color }} />
      <input
        type="color"
        value={color}
        aria-label={label}
        onMouseDown={onOpen}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
