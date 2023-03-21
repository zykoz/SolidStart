import { Accessor, createEffect, createMemo, createSignal, onMount } from "solid-js";
import { marked } from "marked";
import { markedEmoji } from "marked-emoji";

import styles from "./ConstructPost.module.css";
import hljs from "highlight.js";

export default function ConstructPost(props: any) {
    const [markdown, setMarkdown] = createSignal("");
    const [html, setHtml] = createSignal("");

    const [emojiData, setEmojiData] = createSignal({});
    const [showEmojiList, setShowEmojiList] = createSignal(false);
    const [searchEmojiTitle, setSearchEmojiTitle] = createSignal("");
    const [markdownLastChar, setMardownLastChar] = createSignal("");

    onMount(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js";
        document.head.appendChild(script);

        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                const language = hljs.getLanguage(lang) ? lang : "plaintext";
                return hljs.highlight(code, { language }).value;
            },
            langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
            pedantic: true,
            gfm: true,
            breaks: true,
            smartypants: true,
            xhtml: true,
            smartLists: true,
            async: true,
        });

        fetch("https://emoji-api.com/emojis?access_key=7045da4d1db20887df16cb32ad6af6a07873c4a4")
            .then((res) => res.json())
            .then((data) => {
                const emojis = data.reduce((acc: any, { slug, character }: any) => {
                    return { ...acc, [slug]: character };
                }, {});
                const options = {
                    emojis,
                    unicode: true,
                };
                marked.use(markedEmoji(options));
                setEmojiData(data);
                loadEmoji(emojiData());
                const markdownTextArea = document.getElementById("markdownTextArea");
                markdownTextArea && markdownTextArea.addEventListener("input", handleMarkdownChange);
            });
    });

    function handleMarkdownChange(e: any) {
        const markdownText = e.target.value;
        setMardownLastChar(markdownText[e.target.value.length - 1]);
        if (markdownLastChar() === ":") {
            setSearchEmojiTitle("");
            setShowEmojiList(!showEmojiList());
            showEmojiList() ? window.addEventListener("keydown", func) : window.removeEventListener("keydown", func);
        } else {
            e.inputType === "deleteContentBackward"
                ? setSearchEmojiTitle(searchEmojiTitle().slice(0, -1))
                : showEmojiList() && markdownLastChar() !== undefined && setSearchEmojiTitle(searchEmojiTitle() + markdownLastChar());

            document.querySelectorAll("#markdownEmojiList li").forEach((emoji: any) => {
                emoji.getAttribute("title")?.toLowerCase().includes(searchEmojiTitle()) ? (emoji.style.display = "block") : (emoji.style.display = "none");
            });
        }

        setMarkdown(markdownText);
        setHtml(marked(markdownText));
        hljs.highlightAll();
    }

    function loadEmoji(data: any) {
        let index = 0;
        const markdownEmojiList = document.getElementById("markdownEmojiList");
        const emojiList = document.getElementById("emojiList");

        data.forEach((emoji: { slug: string; character: string | null }) => {
            index++;
            let li = document.createElement("li");
            li.setAttribute("title", emoji.slug);
            li.setAttribute("tabindex", `${index}`);
            li.textContent = emoji.character;
            li.classList.add("hover:animate-bounce");
            emojiList && emojiList.appendChild(li);

            let newLi = document.createElement("li");
            let newI = document.createElement("span");
            let newSpan = document.createElement("span");

            newLi.setAttribute("title", emoji.slug);
            newLi.setAttribute("tabindex", `${index}`);
            newI.classList.add("w-[50px]", "inline-block", "text-center");
            newI.textContent = emoji.character;
            newSpan.textContent = `:${emoji.slug}:`;
            newLi.appendChild(newI);
            newLi.appendChild(newSpan);

            markdownEmojiList && markdownEmojiList.appendChild(newLi);
        });
        return markdownEmojiList && markdownEmojiList.querySelectorAll("li");
    }

    function addTextToTextArea(textAreaElement: HTMLTextAreaElement, textToAdd: string) {
        let num = searchEmojiTitle().length * -1;
        if (searchEmojiTitle()) textAreaElement.value = textAreaElement.value.slice(0, num);
        console.log(textAreaElement.value);
        textAreaElement.value += textToAdd;
        setShowEmojiList(!showEmojiList());
    }

    const func = (e: any) => {
        let focusedIndex = 0;
        const markdownEmojiList = document.getElementById("markdownEmojiList");
        const listItems = markdownEmojiList && markdownEmojiList.querySelectorAll("li");

        if (e.key === "Tab") {
            e.preventDefault();
            const textArea = document.getElementById("markdownTextArea") as HTMLTextAreaElement;
            // Create a new input event
            const inputEvent = new Event("input", { bubbles: true });
            setSearchEmojiTitle(":" + listItems[focusedIndex]?.title + ":");
            addTextToTextArea(textArea, searchEmojiTitle());
            setShowEmojiList(!showEmojiList());
            // Dispatch the input event on the text area
            textArea.dispatchEvent(inputEvent);
            textArea.focus();
            return;
        }

        if (markdownEmojiList) {
            // Check if the list is focused
            if (e.key === "ArrowDown" || e.key === "Down") {
                // Move focus down
                focusedIndex++;
                if (listItems && focusedIndex >= listItems.length) {
                    focusedIndex = 0; // Wrap back to the top
                }
            } else if (e.key === "ArrowUp" || e.key === "Up") {
                // Move focus up
                focusedIndex--;
                if (listItems && focusedIndex < 0) {
                    focusedIndex = listItems.length - 1; // Wrap to the bottom
                }
            }
            listItems.forEach((item, index) => {
                if (index === focusedIndex) {
                    item.classList.add("focused", "border", "border-red-700");
                } else {
                    item.classList.remove("focused", "border", "border-red-700");
                }
            });
        }
    };

    return (
        <>
            <div class='dark:bg-darker-700 border border-darker-100 rounded flex mb-4 p-2 w-full justify-between bg-white dark:border-darker-400/70'>
                <div class='w-full h-max dark:text-darker-50 dark:bg-darker-600'>
                    <textarea id='markdownTextArea' value={markdown()} rows='10' class='w-full dark:text-darker-50 dark:bg-darker-600' />
                    <pre id='pre' innerHTML={html()} class={styles.post} />
                </div>
            </div>
            {showEmojiList() && (
                <ul id='markdownEmojiList' class='bg-darker-100 w-max cursor-pointer dark:bg-darker-600 dark:text-darker-50 border focus:border-red-700'>
                    <span>EMOJI MATCHING:{searchEmojiTitle()}</span>
                </ul>
            )}
        </>
    );
}
